'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getCenterCropBox,
  getCornerCropBoxes,
  loadModel,
  predictCrops,
} from '@/lib/model';

export type ScanStatus =
  | 'requesting-camera'
  | 'loading-model'
  | 'scanning'
  | 'candidate'
  | 'cooldown'
  | 'detected'
  | 'error';

export interface DetectionResult {
  sessionId: string;
  detectedAt: string;
  confidence: number;
}

interface CameraScannerProps {
  onDetection: (result: DetectionResult) => void;
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `session_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeVariance(values: number[]): number {
  if (!values.length) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return variance;
}

export default function CameraScanner({ onDetection }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());

  const [status, setStatus] = useState<ScanStatus>('requesting-camera');
  const [error, setError] = useState<string | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number>(0);
  const [holdSteady, setHoldSteady] = useState(false);
  const [debugOpen, setDebugOpen] = useState(
    process.env.NEXT_PUBLIC_DEBUG_OVERLAY_DEFAULT === 'true'
  );

  const gateABufferRef = useRef<number[]>([]);
  const gateBStreakRef = useRef(0);
  const candidateActiveRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const lastInferenceTime = useRef(0);

  const inferenceFps = Math.max(
    1,
    parseInt(process.env.NEXT_PUBLIC_INFERENCE_FPS || '6')
  );
  const inferenceIntervalMs = 1000 / inferenceFps;

  const gateAThreshold = parseFloat(process.env.NEXT_PUBLIC_GATE_A_THRESHOLD || '0.8');
  const gateAWindow = parseInt(process.env.NEXT_PUBLIC_GATE_A_WINDOW || '10');
  const gateAMinHits = parseInt(process.env.NEXT_PUBLIC_GATE_A_MIN_HITS || '6');
  const gateAMaxVariance = parseFloat(process.env.NEXT_PUBLIC_GATE_A_MAX_VARIANCE || '0.01');

  const gateBThreshold = parseFloat(process.env.NEXT_PUBLIC_GATE_B_THRESHOLD || '0.9');
  const gateBMinHits = parseInt(process.env.NEXT_PUBLIC_GATE_B_MIN_HITS || '3');
  const gateBConsecutive = parseInt(
    process.env.NEXT_PUBLIC_GATE_B_CONSECUTIVE || '3'
  );
  const gateBCooldownMs = parseInt(
    process.env.NEXT_PUBLIC_GATE_B_COOLDOWN_MS || '2000'
  );

  const centerCropScale = clamp(
    parseFloat(process.env.NEXT_PUBLIC_CENTER_CROP_SCALE || '0.8'),
    0.4,
    1
  );
  const cornerCropScale = clamp(
    parseFloat(process.env.NEXT_PUBLIC_CORNER_CROP_SCALE || '0.65'),
    0.3,
    1
  );

  const allowDebug = process.env.NODE_ENV !== 'production';

  const cropBoxes = useMemo(() => {
    return {
      center: [getCenterCropBox(centerCropScale)],
      multi: [
        getCenterCropBox(centerCropScale),
        ...getCornerCropBoxes(cornerCropScale),
      ],
    };
  }, [centerCropScale, cornerCropScale]);

  const updateGateABuffer = useCallback(
    (confidence: number) => {
      const buffer = gateABufferRef.current;
      buffer.push(confidence);
      if (buffer.length > gateAWindow) {
        buffer.shift();
      }
    },
    [gateAWindow]
  );

  const getGateAStats = useCallback(() => {
    const buffer = gateABufferRef.current;
    const hits = buffer.filter((score) => score >= gateAThreshold).length;
    const variance = computeVariance(buffer);
    return { hits, variance, size: buffer.length };
  }, [gateAThreshold]);

  const initializeCamera = useCallback(async () => {
    try {
      setStatus('requesting-camera');
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('loading-model');
      await loadModel();

      setStatus('scanning');
      candidateActiveRef.current = false;
      gateBStreakRef.current = 0;
      cooldownUntilRef.current = 0;
      gateABufferRef.current = [];

      animationFrameRef.current = requestAnimationFrame(runInference);
    } catch (err) {
      let errorMessage = 'Failed to access camera.';
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
    }
  }, []);

  const finalizeDetection = useCallback(
    (confidence: number) => {
      setStatus('detected');
      setHoldSteady(false);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      onDetection({
        sessionId: sessionIdRef.current,
        detectedAt: new Date().toISOString(),
        confidence: parseFloat(confidence.toFixed(4)),
      });
    },
    [onDetection]
  );

  const runInference = useCallback(async () => {
    if (!videoRef.current || status === 'error' || status === 'detected') {
      return;
    }

    const now = performance.now();
    if (now - lastInferenceTime.current < inferenceIntervalMs) {
      animationFrameRef.current = requestAnimationFrame(runInference);
      return;
    }

    lastInferenceTime.current = now;

    if (status === 'cooldown' && now >= cooldownUntilRef.current) {
      setStatus('scanning');
    }

    const inCooldown = now < cooldownUntilRef.current;

    try {
      const video = videoRef.current;
      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(runInference);
        return;
      }

      const [centerConfidence] = await predictCrops(video, cropBoxes.center);
      setLastConfidence(centerConfidence);
      updateGateABuffer(centerConfidence);

      const gateAStats = getGateAStats();
      const gateAPassed =
        gateAStats.size >= gateAWindow &&
        gateAStats.hits >= gateAMinHits &&
        gateAStats.variance <= gateAMaxVariance;

      const nearGateA =
        gateAStats.size >= gateAWindow &&
        gateAStats.hits >= Math.max(1, gateAMinHits - 1) &&
        gateAStats.variance <= gateAMaxVariance * 1.5;

      setHoldSteady(!candidateActiveRef.current && !inCooldown && nearGateA);

      if (!candidateActiveRef.current && !inCooldown && gateAPassed) {
        candidateActiveRef.current = true;
        gateBStreakRef.current = 0;
        setStatus('candidate');
      }

      if (candidateActiveRef.current) {
        const cropScores = await predictCrops(video, cropBoxes.multi);
        const passing = cropScores.filter((score) => score >= gateBThreshold).length;
        const framePasses = passing >= gateBMinHits;

        if (framePasses) {
          gateBStreakRef.current += 1;
        } else {
          gateBStreakRef.current = 0;
          candidateActiveRef.current = false;
          cooldownUntilRef.current = now + gateBCooldownMs;
          setStatus('cooldown');
        }

        if (gateBStreakRef.current >= gateBConsecutive) {
          const avgConfidence =
            cropScores.reduce((sum, score) => sum + score, 0) / cropScores.length;
          finalizeDetection(avgConfidence);
          return;
        }
      }

      if (!candidateActiveRef.current && status !== 'cooldown') {
        setStatus('scanning');
      }
    } catch (err) {
      console.error('[CameraScanner] Inference error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(runInference);
  }, [
    cropBoxes.center,
    cropBoxes.multi,
    finalizeDetection,
    gateAWindow,
    gateAMinHits,
    gateAMaxVariance,
    gateBConsecutive,
    gateBCooldownMs,
    gateBMinHits,
    gateBThreshold,
    getGateAStats,
    inferenceIntervalMs,
    status,
    updateGateABuffer,
  ]);

  useEffect(() => {
    initializeCamera();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initializeCamera]);

  const debugStats = getGateAStats();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-4 shadow-2xl backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_55%)]" />
        <div className="video-preview">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="status-badge status-info">
              {status === 'loading-model' && 'Loading model'}
              {status === 'requesting-camera' && 'Requesting camera'}
              {status === 'scanning' && 'Scanning'}
              {status === 'candidate' && 'Candidate found'}
              {status === 'cooldown' && 'Cooling down'}
              {status === 'detected' && 'Confirmed'}
              {status === 'error' && 'Error'}
            </span>
            {holdSteady && status === 'scanning' && (
              <span className="status-badge status-warning">Hold steady</span>
            )}
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {`Confidence ${Math.round(lastConfidence * 100)}%`}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}

      {allowDebug && (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 shadow">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Debug overlay</span>
            <button
              className="btn btn-secondary"
              onClick={() => setDebugOpen((open) => !open)}
              type="button"
            >
              {debugOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          {debugOpen && (
            <div className="mt-3 grid gap-2 text-xs">
              <div className="flex flex-wrap gap-3">
                <span>Gate A: {gateAThreshold.toFixed(2)}</span>
                <span>Window: {gateAWindow}</span>
                <span>Hits: {debugStats.hits}/{gateAWindow}</span>
                <span>Var: {debugStats.variance.toFixed(4)}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <span>Gate B: {gateBThreshold.toFixed(2)}</span>
                <span>Min crops: {gateBMinHits}/5</span>
                <span>Consecutive: {gateBStreakRef.current}/{gateBConsecutive}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <span>Status: {status}</span>
                <span>Cooldown: {Math.max(0, cooldownUntilRef.current - performance.now()).toFixed(0)}ms</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
