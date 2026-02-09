'use client';

import { useState } from 'react';
import Link from 'next/link';
import CameraScanner, { DetectionResult } from '@/components/CameraScanner';

export default function ScanPage() {
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  const handleDetection = (result: DetectionResult) => {
    setDetectionResult(result);

    console.log(
      JSON.stringify({
        event: 'maski_confirmed',
        timestamp: new Date().toISOString(),
        ...result,
      })
    );
  };

  const handleEnterCompetition = () => {
    if (!detectionResult) return;

    const formBaseUrl =
      process.env.NEXT_PUBLIC_FORM_URL || 'https://forms.office.com/PLACEHOLDER_FORM_URL';
    const campaign = process.env.NEXT_PUBLIC_CAMPAIGN || 'maski_mvp';

    const params = new URLSearchParams({
      sessionId: detectionResult.sessionId,
      timestamp: detectionResult.detectedAt,
      confidence: detectionResult.confidence.toString(),
      campaign,
    });

    const formUrl = `${formBaseUrl}?${params.toString()}`;

    console.log(
      JSON.stringify({
        event: 'competition_entry_initiated',
        timestamp: new Date().toISOString(),
        formUrl,
        ...detectionResult,
      })
    );

    window.open(formUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Scan Mode
            </p>
            <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
              Find Maski and lock the moment.
            </h1>
            <p className="text-base text-slate-600">
              Keep the mask centered. We only confirm after a steady, multi-angle check to
              prevent false positives.
            </p>
          </div>
          <Link className="btn btn-secondary" href="/">
            Back to Home
          </Link>
        </div>

        {detectionResult ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="card bg-emerald-50/70">
              <div className="text-6xl">🎉</div>
              <h2 className="mt-4 text-3xl font-semibold text-emerald-900">
                Maski confirmed.
              </h2>
              <p className="mt-2 text-sm text-emerald-800">
                Final confidence: {(detectionResult.confidence * 100).toFixed(1)}%
              </p>
              <button
                onClick={handleEnterCompetition}
                className="btn btn-primary mt-6 w-full"
              >
                Open Microsoft Form
              </button>
              <p className="mt-2 text-xs text-emerald-700">
                Opens a new tab with your session details.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-slate-900">Next steps</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>Review the form details before submitting.</li>
                <li>Capture a clear photo for your own records.</li>
                <li>Scan again if you want a cleaner confidence score.</li>
              </ul>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary mt-6 w-full"
              >
                Scan Again
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <CameraScanner onDetection={handleDetection} />
            <div className="space-y-4">
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-900">Keep it steady</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Use a stable grip. Gate A watches consistency, Gate B confirms across
                  multiple crops.
                </p>
              </div>
              <div className="card bg-amber-50/70">
                <h3 className="text-lg font-semibold text-amber-900">Field tips</h3>
                <ul className="mt-2 space-y-2 text-sm text-amber-900">
                  <li>Good lighting beats high ISO noise.</li>
                  <li>Keep Maski centered before moving closer.</li>
                  <li>Wait for the “Hold steady” hint.</li>
                </ul>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-900">Privacy</h3>
                <p className="mt-2 text-sm text-slate-600">
                  All inference runs in-browser. No images are uploaded or stored.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
