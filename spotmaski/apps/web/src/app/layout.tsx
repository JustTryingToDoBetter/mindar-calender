import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpotMaski - Two-Stage Maski Detection',
  description: 'In-browser Maski detection with hard-negative gating and Microsoft Forms registration.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#0B3D3A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="app-shell min-h-screen">{children}</main>
      </body>
    </html>
  );
}
