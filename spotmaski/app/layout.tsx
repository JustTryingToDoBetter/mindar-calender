import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpotMaski - Find Maski, Win Prizes!',
  description: 'Use your camera to spot the Maski character and enter our competition.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#8B5CF6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
          {children}
        </main>
      </body>
    </html>
  );
}
