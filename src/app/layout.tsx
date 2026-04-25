import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'QuickFormsPH — Fill Government Forms Fast',
  description:
    'Select a Philippine government form, fill it up on your phone, and download a print-ready PDF.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
