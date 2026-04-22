import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About — QuickFormsPH',
  description:
    'Learn about QuickFormsPH — a free tool for filling Philippine government forms fast — and its developer, Jeffrey John Gran.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/quickformsph-logo-transparent-slogan.png"
              alt="QuickFormsPH"
              width={160}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <Link href="/" className="text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors">
            ← Back to Forms
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-10">

        {/* ── About QuickFormsPH ── */}
        <section>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-700 font-semibold mb-4">
            📄 About This App
          </div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight mb-3">
            QuickFormsPH
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            A simple tool built to help Filipinos fill out Philippine government forms quickly — right on their phone or browser — and download a clean, print-ready PDF.
            No account needed. No data stored on any server.
          </p>

          {/* Quick notes — inspired by marketplace.jeffreygran.com/about layout */}
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-2.5">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-3">Quick Notes</div>
            {[
              ['📱', 'Works entirely in your browser — no app download required'],
              ['🔒', 'Your personal data is never sent to any server during form fill-up'],
              ['💸', 'Free to use — a small ₱5 fee applies only when generating your final PDF'],
              ['⬇️', 'Generated PDFs are available for re-download for 48 hours using your download code'],
              ['🏛️', 'Forms are sourced from official Philippine government agency templates'],
            ].map(([icon, text]) => (
              <div key={String(text)} className="flex items-start gap-2.5 text-sm text-blue-900">
                <span className="text-base shrink-0 mt-0.5">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="border-t border-gray-200" />

        {/* ── About the Developer ── */}
        <section>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs text-gray-600 font-semibold mb-4">
            👨‍💻 Developer
          </div>
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-1">
              <h2 className="text-xl font-black text-gray-900">Jeffrey John Gran</h2>
              <p className="text-sm text-blue-700 font-semibold mt-0.5">Cloud Solutions Architect · Microsoft</p>
              <p className="text-xs text-gray-500 mt-1 italic">
                &ldquo;Empowering organizations to accelerate frontier transformation with cloud and AI.&rdquo;
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            Jeffrey is a Cloud Solutions Architect at Microsoft, focused on helping organizations navigate cloud and AI modernization. He brings over 20 years of software and systems experience spanning enterprise architecture, telecom, financial services, and AI platforms.
          </p>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ['20+', 'Years Experience'],
              ['9+', 'Projects Delivered'],
              ['22+', 'Teams Managed'],
            ].map(([num, label]) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                <div className="text-xl font-black text-blue-700">{num}</div>
                <div className="text-[10px] text-gray-500 font-medium mt-0.5 leading-snug">{label}</div>
              </div>
            ))}
          </div>

          {/* Background highlights */}
          <div className="mt-5 space-y-3">
            {[
              {
                icon: '🏢',
                title: 'Enterprise Software Architecture',
                desc: 'Designed and delivered enterprise customer applications for major Philippine telecom, retail, and banking firms — covering mobile marketing, loyalty, loan management, and prepaid services.',
              },
              {
                icon: '🌐',
                title: 'Financial & Insurance Services',
                desc: 'Provided advanced application support for title insurance and financial services at a Fortune 500 leader in U.S. mortgage and diversified services.',
              },
              {
                icon: '🚀',
                title: 'Project & Team Leadership',
                desc: 'Planned and delivered projects end-to-end in fast-paced startup environments, leading cross-functional teams of engineers, analysts, and QA specialists using Agile/Scrum and MSF.',
              },
              {
                icon: '🤖',
                title: 'AI & Cloud Innovation',
                desc: 'Rapidly adapts across cloud (Azure), AI (LLMs, RAG, computer vision), network security, HA/DR, app modernization, and emerging dev tools — always exploring the frontier.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-800 mb-0.5">{item.title}</div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Side projects */}
          <div className="mt-5">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Side Projects</div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  icon: '🤖',
                  name: 'Sparky',
                  tag: 'AI Platform',
                  desc: 'Privacy-first, self-hosted AI platform on NVIDIA DGX Spark with local LLM routing, RAG knowledge base, and image generation.',
                },
                {
                  icon: '🛒',
                  name: 'Local Marketplace',
                  tag: 'Community Commerce',
                  desc: 'A site built to help neighbors buy and sell homemade food, crafts, and everyday goods conveniently within the community.',
                },
                {
                  icon: '📄',
                  name: 'QuickFormsPH',
                  tag: 'This App · Gov Forms',
                  desc: 'The app you\'re using right now — Filipino government forms, filled fast, downloaded as print-ready PDFs.',
                },
              ].map((p) => (
                <div key={p.name} className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{p.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{p.name}</div>
                      <div className="text-[10px] text-blue-600 font-medium">{p.tag}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Back button ── */}
        <div className="pt-2 pb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-6 py-3 text-sm font-bold text-white transition-colors"
          >
            ← Back to QuickFormsPH
          </Link>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-400">
        <span className="font-medium text-gray-600">QuickFormsPH</span>
        <span className="mx-1">v1.0.0</span>
        <span className="mx-2 text-gray-300">·</span>
        Developed by J.Gran
        <span className="mx-2 text-gray-300">·</span>
        <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
