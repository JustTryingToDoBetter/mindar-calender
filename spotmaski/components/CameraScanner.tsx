'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadModel, predictMaski } from '@/lib/model';
import { PredictionStabilizer } from '@/lib/stabilizer';

export type ScanStatus =
  | 'requesting-camera'
  | 'loading-model'
  | 'scanning'
  | 'detected'
  | 'error';

export interface DetectionResult {
  sessionId: string;
  detectedAt: string;
  avgConfidence: number;
}

interface CameraScannerProps {
  onDetection: (result: DetectionResult) => void;
}

export default function CameraScanner({ onDetection }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stabilizerRef = useRef<PredictionStabilizer | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());

  const [status, setStatus] = useState<ScanStatus>('requesting-camera');
  const [error, setError] = useState<string | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number>(0);
  const [isDetecting, setIsDetecting] = useState(false);

  // Inference FPS throttle
  const inferenceIntervalMs = 1000 / parseInt(process.env.NEXT_PUBLIC_INFERENCE_FPS || '8');
  const lastInferenceTime = useRef<number>(0);

  /**
   * Initialize camera and model
   */
  const initializeCamera = useCallback(async () => {
    try {
      setStatus('requesting-camera');
      setError(null);

      console.log(JSON.stringify({
        event: 'camera_request',
        timestamp: new Date().toISOString(),
        sessionId: sessionIdRef.current,
      }));

      // Request camera access (prefer rear camera on mobile)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      console.log(JSON.stringify({
        event: 'camera_ready',
        timestamp: new Date().toISOString(),
      }));

      // Load ML model
      setStatus('loading-model');
      await loadModel();

      // Initialize stabilizer
      stabilizerRef.current = new PredictionStabilizer();

      // Start scanning
      setStatus('scanning');
      setIsDetecting(true);

    } catch (err) {
      console.error('[CameraScanner] Initialization error:', err);

      let errorMessage = 'Failed to access camera';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and refresh.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setStatus('error');

      console.log(JSON.stringify({
        event: 'camera_error',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Run inference loop
   */
  const runInference = useCallback(async () => {
    if (!isDetecting || status !== 'scanning' || !videoRef.current || !canvasRef.current) {
      return;
    }

    const now = Date.now();

    // Throttle inference to target FPS
    if (now - lastInferenceTime.current < inferenceIntervalMs) {
      animationFrameRef.current = requestAnimationFrame(runInference);
      return;
    }

    lastInferenceTime.current = now;

    try {
      // Capture frame from video to offscreen canvas
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== 4) {
        animationFrameRef.current = requestAnimationFrame(runInference);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Run inference
      const prediction = await predictMaski(canvas);

      setLastConfidence(prediction.confidence);

      // Check stabilizer
      if (stabilizerRef.current && prediction.isMaski) {
        const result = stabilizerRef.current.push(prediction.confidence);

        if (result.triggered) {
          // Detection triggered!
          console.log(JSON.stringify({
            event: 'detection_triggered',
            timestamp: new Date().toISOString(),
            sessionId: sessionIdRef.current,
            avgConfidence: result.avg,
            countMaski: result.countMaski,
          }));

          // Stop scanning
          setIsDetecting(false);
          setStatus('detected');

          // Notify parent component
          onDetection({
            sessionId: sessionIdRef.current,
            detectedAt: new Date().toISOString(),
            avgConfidence: parseFloat(result.avg.toFixed(3)),
          });

          return; // Stop the loop
        }
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(runInference);

    } catch (err) {
      console.error('[CameraScanner] Inference error:', err);
      animationFrameRef.current = requestAnimationFrame(runInference);
    }
  }, [isDetecting, status, inferenceIntervalMs, onDetection]);

  /**
   * Stop camera and clean up
   */
  const stopCamera = useCallback(() => {
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    console.log(JSON.stringify({
      event: 'camera_stopped',
      timestamp: new Date().toISOString(),
    }));
  }, []);

  /**
   * Restart scanning with new session
   */
  const restart = useCallback(() => {
    stopCamera();
    sessionIdRef.current = generateSessionId();
    stabilizerRef.current?.reset();
    setLastConfidence(0);
    setIsDetecting(false);
    setStatus('requesting-camera');
    setError(null);

    // Reinitialize after a short delay
    setTimeout(() => {
      initializeCamera();
    }, 100);
  }, [stopCamera, initializeCamera]);

  // Initialize on mount
  useEffect(() => {
    initializeCamera();

    return () => {
      stopCamera();
    };
  }, [initializeCamera, stopCamera]);

  // Start inference loop when scanning
  useEffect(() => {
    if (isDetecting && status === 'scanning') {
      animationFrameRef.current = requestAnimationFrame(runInference);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDetecting, status, runInference]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      {/* Video preview */}
      <div className="video-preview relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Offscreen canvas for inference */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Status overlay */}
        {(status === 'requesting-camera' || status === 'loading-model') && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white space-y-4">
              <div className="spinner mx-auto" />
              <p className="text-lg">
                {status === 'requesting-camera' && 'Requesting camera...'}
                {status === 'loading-model' && 'Loading AI model...'}
              </p>
            </div>
          </div>
        )}

        {/* Scanning indicator */}
        {status === 'scanning' && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <span className="status-badge status-info animate-pulse-slow">
              Scanning...
            </span>
            {lastConfidence > 0 && (
              <span className="status-badge status-warning">
                {(lastConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {status === 'error' && error && (
        <div className="card w-full max-w-md bg-red-50 border-2 border-red-200">
          <p className="text-red-800 text-center mb-4">{error}</p>
          <button
            onClick={restart}
            className="btn btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Restart button (only show during scanning) */}
      {status === 'scanning' && (
        <button
          onClick={restart}
          className="btn btn-secondary"
        >
          Restart Scan
        </button>
      )}
    </div>
  );
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
