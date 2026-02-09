'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Maski Detection MVP
            </p>
            <h1 className="mt-3 text-5xl font-semibold text-slate-900 md:text-6xl">
              Spot Maski. Prove it. Claim your entry.
            </h1>
          </div>
          <Link href="/scan" className="btn btn-primary">
            Start Scanning
          </Link>
        </header>

        <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="card bg-white/70">
            <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-600">
              The in-browser model checks every frame, filters false positives with
              stability rules, then confirms across multiple crops. No uploads. No backend.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Gate A
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Consistent center confidence across a rolling window.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Gate B
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Confirms with multi-crop agreement before success.
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-emerald-50 via-white to-amber-50">
            <div className="text-7xl">🎭</div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Ready to scan?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Give the camera a steady view. The pipeline is tuned for stability on mobile.
            </p>
            <Link href="/scan" className="btn btn-secondary mt-6 inline-flex">
              Open Scanner
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="card">
            <h4 className="text-lg font-semibold text-slate-900">Deterministic</h4>
            <p className="mt-2 text-sm text-slate-600">
              Thresholds, buffers, and cooldowns are configured via env vars.
            </p>
          </div>
          <div className="card">
            <h4 className="text-lg font-semibold text-slate-900">Private</h4>
            <p className="mt-2 text-sm text-slate-600">
              Camera frames never leave the device. Everything runs in the browser.
            </p>
          </div>
          <div className="card">
            <h4 className="text-lg font-semibold text-slate-900">Vercel-ready</h4>
            <p className="mt-2 text-sm text-slate-600">
              Next.js App Router with static assets in /public/model.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
