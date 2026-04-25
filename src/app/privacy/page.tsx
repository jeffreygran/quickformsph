import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — QuickFormsPH',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to QuickFormsPH</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mt-1">Last updated: April 2026</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-900">
          <strong>Your data stays with you.</strong> Everything you type is processed <em>entirely inside your browser</em> — nothing is sent to any server. Your form details are used only to fill your PDF, and the PDF is generated offline on your device. We do not collect, store, or transmit your personal information.
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">1. Information We Use</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            When you fill in a government form on QuickFormsPH, you may enter personal information such as
            your full name, address, identification numbers, contact details, and financial figures
            (depending on the form). This information is entered by you, stays in your browser, and is used
            solely to generate a print-ready PDF of the selected form on your device.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">2. How We Handle Your Data</h2>
          <ul className="text-sm text-gray-700 leading-relaxed space-y-2 list-disc list-inside">
            <li><strong>Auto-save drafts:</strong> Your in-progress entries may be saved to your browser&apos;s <code>localStorage</code> so you can resume later. This data never leaves your device.</li>
            <li><strong>PDF generation:</strong> PDFs are built entirely within your browser using a client-side PDF library. No form data is ever transmitted to or stored on any external server.</li>
            <li><strong>Privacy acknowledgement:</strong> A simple flag (<code>qfph_privacy_ack</code>) is stored in <code>localStorage</code> to remember that you have read this policy. It contains no personal data.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">3. Republic Act No. 10173 — Data Privacy Act of 2012</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            QuickFormsPH is designed with privacy by default: because all processing happens locally on
            your device and no personal data is collected or transmitted, we act as a mere tool rather
            than a personal information controller. Nevertheless, we respect and support the intent of
            the Philippine Data Privacy Act of 2012 (RA 10173).
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Your data rights under RA 10173 include: the right to be informed, right of access, right
            to correction, right to erasure or blocking, right to data portability, and right to object.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">4. Cookies &amp; Analytics</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            We do not use tracking cookies or third-party analytics. The only browser storage we use
            is <code>localStorage</code> for saving your form drafts and your privacy acknowledgement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">5. Third Parties</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            We do not sell, share, or transfer your personal data to third parties. Government agencies
            are not automatically notified when you fill a form — you still need to print and submit
            the generated PDF yourself.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">6. Privacy Concerns</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Since no personal data is collected or held by QuickFormsPH, there is nothing to request
            access to, correct, or delete on our end. To clear any locally saved drafts, simply clear
            your browser&apos;s site data for this page. For general RA 10173 complaints or inquiries,
            you may contact the National Privacy Commission (NPC) at{' '}
            <a
              href="https://www.privacy.gov.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              www.privacy.gov.ph
            </a>.
          </p>
        </section>

        {/* Non-affiliation notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-sm text-yellow-900">
          <strong>⚠️ Disclaimer:</strong> QuickFormsPH is a <strong>private, independent tool</strong>. It is
          not affiliated with, endorsed by, or connected to any Philippine government agency. Forms are reproduced
          from publicly available official templates solely to help users complete them correctly.
        </div>

        <div className="border-t border-gray-200 pt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to QuickFormsPH</Link>
        </div>
      </main>
    </div>
  );
}
