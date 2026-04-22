import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

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
        <footer className="border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-400">
          <span className="font-medium text-gray-600">QuickFormsPH</span>
          <span className="mx-1">v1.0.0</span>
          <span className="mx-2 text-gray-300">·</span>
          Developed by{' '}
          <Link href="/about" className="text-blue-600 hover:text-blue-800 underline">
            J.Gran
          </Link>
          <span className="mx-2 text-gray-300">·</span>
          <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link>
        </footer>
      </body>
    </html>
  );
}
