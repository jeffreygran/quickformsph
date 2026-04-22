'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FORMS, FormSchema } from '@/data/forms';

const AGENCY_FILTERS = ['All', ...Array.from(new Set(FORMS.map((f) => f.agency)))];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [agency, setAgency] = useState('All');
  const router = useRouter();

  // Secret: Shift + double-click on the logo → Admin login
  const lastClickRef = useRef<number>(0);
  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    if (!e.shiftKey) return;
    const now = Date.now();
    if (now - lastClickRef.current < 400) {
      router.push('/admin/login');
    }
    lastClickRef.current = now;
  }, [router]);

  const filtered = FORMS.filter((f) => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.agency.toLowerCase().includes(search.toLowerCase());
    const matchAgency = agency === 'All' || f.agency === agency;
    return matchSearch && matchAgency;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          {/* Logo — Shift+double-click to reach admin */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-default select-none"
            aria-label="QuickFormsPH"
          >
            <span className="text-2xl">🇵🇭</span>
            <div>
              <div className="text-sm font-bold leading-tight text-blue-700">QuickFormsPH</div>
              <div className="text-[10px] text-gray-400 leading-tight">Gov't Forms, Done Fast</div>
            </div>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-blue-700 px-4 py-10 text-center text-white">
        <h1 className="text-2xl font-bold leading-snug">
          Fill Government Forms
          <br />
          in Minutes
        </h1>
        <p className="mt-2 text-sm text-blue-200">
          Select a form, fill it on your phone, download a print-ready PDF. Free.
        </p>

        {/* Search */}
        <div className="mx-auto mt-5 max-w-md">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="search"
              placeholder="Search forms (e.g. MP2, Pag-IBIG, BIR…)"
              className="w-full rounded-xl border-0 bg-white py-3 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Agency Filters */}
      <div className="mx-auto max-w-4xl overflow-x-auto px-4 py-3">
        <div className="flex gap-2">
          {AGENCY_FILTERS.map((a) => (
            <button
              key={a}
              onClick={() => setAgency(a)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                agency === a
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Form Cards */}
      <main className="mx-auto max-w-4xl px-4 pb-12">
        {filtered.length === 0 ? (
          <div className="mt-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No forms match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((form) => (
              <FormCard key={form.slug} form={form} />
            ))}
          </div>
        )}

        {/* Coming soon banner */}
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <p className="text-sm text-gray-400">
            More forms coming soon — BIR, SSS, PhilHealth, and more.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Admin can upload PDFs via the Admin Portal.
          </p>
        </div>
      </main>
    </div>
  );
}

function FormCard({ form }: { form: FormSchema }) {
  return (
    <Link href={`/forms/${form.slug}`} className="form-card p-5 block">
      <div className="flex items-start justify-between gap-2">
        <div className="text-2xl">📄</div>
        <span className="badge-agency">{form.agency}</span>
      </div>
      <div className="mt-3">
        <div className="text-xs font-mono text-gray-400 mb-0.5">{form.code}</div>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-3">
          {form.name}
        </h3>
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{form.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">{form.fields.length} fields</span>
        <span className="text-xs font-semibold text-blue-700">Fill Now →</span>
      </div>
    </Link>
  );
}
