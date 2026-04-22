import type { Metadata } from 'next';
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
        <footer className="border-t border-gray-200 bg-white py-4 px-6 text-center text-xs text-gray-500">
          <span className="font-medium text-gray-700">QuickFormsPH</span>
          <span className="mx-1 text-gray-400">v1.0.0</span>
          <span className="mx-2 text-gray-300">·</span>
          Developed by{' '}
          <a
            href="http://www.jeffreygran.gran"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            J.Gran
          </a>
        </footer>
      </body>
    </html>
  );
}
