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
          <strong>Short version:</strong> Your personal data (name, address, IDs) is used <em>only</em> to fill
          your PDF form in real time. We do not store, share, or process your data on our servers.
          Everything happens in your browser.
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">1. Information We Use</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            When you fill in a government form on QuickFormsPH, you enter personal information such as
            your full name, address, identification numbers, contact details, and financial information
            (depending on the form). This information is entered by you, in your browser, and is used
            solely to generate a print-ready PDF of the form you selected.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">2. How We Handle Your Data</h2>
          <ul className="text-sm text-gray-700 leading-relaxed space-y-2 list-disc list-inside">
            <li><strong>In-browser processing:</strong> Your form data is processed client-side (in your browser) to render the PDF preview.</li>
            <li><strong>Server-side PDF generation:</strong> When you click &quot;Generate &amp; Download PDF,&quot; your form values are sent over an encrypted (HTTPS) connection to our server solely to embed them into the official PDF template. This data is not logged or stored after the PDF is generated.</li>
            <li><strong>Auto-save drafts:</strong> Your in-progress entries are saved to your browser&apos;s <code>localStorage</code> so you can resume later. This data never leaves your device.</li>
            <li><strong>Download codes:</strong> If you pay the ₱5 support fee, a temporary record linking your code to your form data is stored for up to 48 hours, then automatically deleted. This allows you to re-download your PDF within that window.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">3. Republic Act No. 10173 — Data Privacy Act of 2012</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            QuickFormsPH is committed to protecting your personal data in compliance with the Philippine
            Data Privacy Act of 2012 (RA 10173) and its implementing rules and regulations. By using
            this service, you consent to the collection and limited processing of your personal data as
            described in this policy.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Your data rights under RA 10173 include: the right to be informed, right of access, right
            to correction, right to erasure or blocking, right to damages, right to file a complaint,
            right to data portability, and right to object.
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
          <h2 className="text-base font-semibold text-gray-900">6. Contact</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            For privacy concerns or to exercise your data rights, please contact us at:{' '}
            <a href="mailto:hello@jeffreygran.com" className="text-blue-600 hover:underline">
              hello@jeffreygran.com
            </a>
          </p>
        </section>

        <div className="border-t border-gray-200 pt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to QuickFormsPH</Link>
        </div>
      </main>
    </div>
  );
}
