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
      <body className="min-h-screen text-gray-900 antialiased flex flex-col" style={{ background: '#050d1f' }}>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-blue-400/50">
          <span className="font-medium text-blue-300/70">QuickFormsPH</span>
          <span className="mx-1 text-blue-400/30">v1.0.0</span>
          <span className="mx-2 text-blue-400/20">·</span>
          Developed by{' '}
          <a
            href="http://www.jeffreygran.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            J.Gran
          </a>
          <span className="mx-2 text-blue-400/20">·</span>
          <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a>
        </footer>
      </body>
    </html>
  );
}
