import type { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'About — QuickFormsPH',
  description:
    'QuickFormsPH is a private, offline-first tool for filling Philippine government forms. No account, no uploads, no server.',
};

export default function AboutPage() {
  return <AboutContent />;
}
