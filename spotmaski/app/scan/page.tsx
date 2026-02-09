'use client';

import { useState } from 'react';
import Link from 'next/link';
import CameraScanner, { DetectionResult } from '@/components/CameraScanner';

export default function ScanPage() {
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  const handleDetection = (result: DetectionResult) => {
    setDetectionResult(result);

    console.log(JSON.stringify({
      event: 'maski_detected',
      timestamp: new Date().toISOString(),
      ...result,
    }));
  };

  const handleEnterCompetition = () => {
    if (!detectionResult) return;

    // Build Microsoft Form URL with query params
    const formBaseUrl = process.env.NEXT_PUBLIC_FORM_URL || 'https://forms.office.com/PLACEHOLDER_FORM_URL';

    const params = new URLSearchParams({
      sessionId: detectionResult.sessionId,
      detectedAt: detectionResult.detectedAt,
      avgConfidence: detectionResult.avgConfidence.toString(),
    });

    const formUrl = `${formBaseUrl}?${params.toString()}`;

    console.log(JSON.stringify({
      event: 'competition_entry_initiated',
      timestamp: new Date().toISOString(),
      formUrl,
      ...detectionResult,
    }));

    // Open form in new tab
    window.open(formUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            SpotMaski Scanner
          </h1>
          <p className="text-gray-600">
            Point your camera at Maski to detect him
          </p>
        </div>

        {/* Detection result (shown when detected) */}
        {detectionResult ? (
          <div className="space-y-6">
            {/* Success card */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl font-bold text-green-900">
                You spotted Maski!
              </h2>
              <p className="text-gray-700">
                Confidence: {(detectionResult.avgConfidence * 100).toFixed(1)}%
              </p>

              <div className="space-y-4 pt-4">
                <button
                  onClick={handleEnterCompetition}
                  className="btn btn-success text-lg px-12 py-4 w-full md:w-auto shadow-lg hover:shadow-xl"
                >
                  Enter Competition
                </button>

                <p className="text-sm text-gray-600">
                  Opens Microsoft Form in a new tab
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setDetectionResult(null);
                  window.location.reload(); // Reload to restart scanner
                }}
                className="btn btn-secondary"
              >
                Scan Again
              </button>
              <Link href="/" className="btn btn-secondary text-center">
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          // Camera scanner (shown when not detected)
          <>
            <CameraScanner onDetection={handleDetection} />

            {/* Back button */}
            <div className="text-center">
              <Link href="/" className="btn btn-secondary">
                Back to Home
              </Link>
            </div>

            {/* Tips */}
            <div className="card bg-blue-50 border-2 border-blue-200 text-sm text-gray-700">
              <h3 className="font-semibold text-blue-900 mb-2">Tips for best results:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure good lighting</li>
                <li>Hold camera steady</li>
                <li>Get Maski fully in frame</li>
                <li>Avoid glare or shadows</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
