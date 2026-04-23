import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuickFormsPH — Fill Government Forms Fast',
  description:
    'Select a Philippine government form, fill it up on your phone, and download a print-ready PDF.',
};

const IS_DEV = process.env.NEXT_PUBLIC_APP_ENV === 'dev';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        <div className="flex-1">{children}</div>        <footer className="border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-400">
          <div className="mb-1.5 text-[11px] text-gray-400">
            QuickFormsPH is a private tool and is <strong className="text-gray-500">not affiliated with any Philippine government agency</strong>.
          </div>
          <Link href="/about" className="font-medium text-gray-600 hover:text-blue-700 transition-colors">
            QuickFormsPH <span className="font-normal">v1.0</span>
          </Link>
          <span className="mx-2 text-gray-300">·</span>
          <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link>
        </footer>
      </body>
    </html>
  );
}
