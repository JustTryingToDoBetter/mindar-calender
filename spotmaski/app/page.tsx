'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary">
            SpotMaski
          </h1>
          <p className="text-xl text-gray-600">
            Find Maski in the wild and win prizes!
          </p>
        </div>

        {/* Illustration placeholder */}
        <div className="py-8">
          <div className="w-48 h-48 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-2xl">
            <div className="text-8xl">🎭</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            How it works
          </h2>
          <ol className="text-left space-y-3 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Point your camera at Maski</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>Our AI detects when you find him</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>Register to enter the competition</span>
            </li>
          </ol>
        </div>

        {/* CTA Button */}
        <div>
          <Link
            href="/scan"
            className="btn btn-primary text-lg px-12 py-4 inline-block shadow-lg hover:shadow-xl"
          >
            Start Scanning
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-sm text-gray-500 pt-4">
          Camera access required. Works best in good lighting.
        </p>
      </div>
    </div>
  );
}
