'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FORMS } from '@/data/forms';

const IS_DEV = process.env.NEXT_PUBLIC_APP_ENV === 'dev';

type AdminTab = 'dashboard' | 'catalog' | 'forms' | 'upload' | 'storage' | 'settings' | 'suggestions' | 'refs' | 'security' | 'keys' | 'docs' | 'referral';

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verify session on mount — redirect to login if not authenticated
  useEffect(() => {
    fetch('/api/auth/login')
      .then((res) => {
        if (!res.ok) window.location.replace('/mc/login');
      })
      .catch(() => window.location.replace('/mc/login'));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    window.location.href = '/mc/login';
  }

  const tabsTop: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'dashboard',   icon: '📊', label: 'Dashboard' },
    { id: 'catalog',     icon: '📋', label: 'Form Catalog' },
    { id: 'storage',     icon: '💾', label: 'Storage Config' },
    { id: 'refs',        icon: '🧾', label: 'Payments' },
    { id: 'settings',    icon: '⚙️', label: 'Settings' },
    { id: 'security',    icon: '🛡️', label: 'Security' },
  ];
  const tabsMid: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'suggestions', icon: '💡', label: 'Suggestions' },
    { id: 'keys',        icon: '🏷️', label: 'Promo Codes' },
    { id: 'referral',    icon: '🤝', label: 'Referral Program' },
  ];
  const tabsBottom: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'docs',        icon: '📚', label: 'Form Data Dictionary' },
  ];
  const tabs = [...tabsTop, ...tabsMid, ...tabsBottom];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/quickformsph-logo-transparent-slogan2.png"
              alt="QuickFormsPH"
              width={140}
              height={38}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <span className="ml-1 text-[10px] font-semibold text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Admin</span>
          {IS_DEV && (
            <span className="inline-flex items-center rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-yellow-900 ring-1 ring-yellow-500/40">DEV</span>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {tabsTop.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
          <hr className="my-2 border-t border-gray-100" />
          {tabsMid.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
          <hr className="my-2 border-t border-gray-100" />
          {tabsBottom.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-2">Logged in as admin</div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
          <button
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <h1 className="text-sm font-semibold text-gray-900">
            {tab === 'forms'
              ? 'Forms (DB)'
              : tab === 'upload'
              ? 'Upload PDF'
              : tabs.find((t) => t.id === tab)?.label ?? 'Admin'}
          </h1>
          {(tab === 'catalog' || tab === 'forms' || tab === 'upload') && (
            <div className="flex items-center gap-3 pl-3 ml-1 border-l border-gray-200">
              <button
                onClick={() => setTab('catalog')}
                className={`text-xs font-medium transition-colors ${
                  tab === 'catalog'
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-500 hover:text-blue-600 hover:underline'
                }`}
              >
                📋 Form Catalog
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setTab('forms')}
                className={`text-xs font-medium transition-colors ${
                  tab === 'forms'
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-500 hover:text-blue-600 hover:underline'
                }`}
              >
                🗄️ Forms (DB)
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setTab('upload')}
                className={`text-xs font-medium transition-colors ${
                  tab === 'upload'
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-500 hover:text-blue-600 hover:underline'
                }`}
              >
                ⬆️ Upload PDF
              </button>
            </div>
          )}
          <div className="ml-auto">
            <Link href="/" className="text-xs text-blue-600 hover:underline">
              ← View Site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {tab === 'dashboard'   && <DashboardTab />}
          {tab === 'catalog'     && <CatalogTab />}
          {tab === 'forms'       && <FormsCrudTab />}
          {tab === 'upload'      && <UploadTab />}
          {tab === 'storage'     && <StorageConfigTab />}
          {tab === 'suggestions' && <SuggestionsTab />}
          {tab === 'refs'        && <PaymentRefsTab />}
          {tab === 'settings'    && <SettingsTab />}
          {tab === 'security'    && <SecurityTab />}
          {tab === 'keys'        && <LicenseKeysTab />}
          {tab === 'referral'    && <ReferralProgramTab />}
          {tab === 'docs'        && <DocsTab />}
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month';

interface FormAnalytics {
  slug: string;
  form_views: number;
  demo_clicks: number;
  payment_successes: number;
}
interface DailyBucket {
  date: string;
  form_views: number;
  demo_clicks: number;
  payment_successes: number;
}
interface DashboardStats {
  period: Period;
  perForm: FormAnalytics[];
  totalFormViews: number;
  totalDemoClicks: number;
  totalPaymentSuccesses: number;
  totalChatQuestions: number;
  uniqueVisitors: number;
  claimedCodes: number;
  unclaimedCodes: number;
  dailyBuckets: DailyBucket[];
}

function useDashboardStats(period: Period, refreshMs: number, refreshTick: number) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(0);

  // Initial + period-change fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then((d) => { if (!cancelled) { setData(d as DashboardStats); setLoading(false); setLastFetchedAt(Date.now()); } })
      .catch(() => { if (!cancelled) { setData(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [period, refreshTick]);

  // Background auto-refresh — silent (no spinner) so the dashboard doesn't flash on every poll.
  useEffect(() => {
    if (refreshMs <= 0) return;
    const id = setInterval(() => {
      fetch(`/api/admin/analytics?period=${period}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) { setData(d as DashboardStats); setLastFetchedAt(Date.now()); } })
        .catch(() => { /* keep last good data */ });
    }, refreshMs);
    return () => clearInterval(id);
  }, [period, refreshMs]);

  return { data, loading, lastFetchedAt };
}

// Simple inline SVG bar chart (no deps)
function BarChart({ buckets }: { buckets: DailyBucket[] }) {
  if (!buckets.length) return <div className="text-xs text-gray-400 py-8 text-center">No data yet</div>;

  const maxVal = Math.max(...buckets.flatMap((b) => [b.form_views, b.demo_clicks, b.payment_successes]), 1);
  const H = 80;
  const barW = Math.max(4, Math.floor(320 / (buckets.length * 3 + buckets.length)));
  const gap  = Math.floor(barW * 0.4);
  const groupW = barW * 3 + gap * 2;
  const totalW = buckets.length * (groupW + 4);

  return (
    <div className="overflow-x-auto">
      <svg width={totalW} height={H + 28} className="block">
        {buckets.map((b, i) => {
          const x = i * (groupW + 4);
          const fvH = Math.round((b.form_views / maxVal) * H);
          const dcH = Math.round((b.demo_clicks / maxVal) * H);
          const psH = Math.round((b.payment_successes / maxVal) * H);
          const label = b.date.slice(5); // MM-DD
          return (
            <g key={b.date}>
              <title>{b.date}: Views={b.form_views} Demo={b.demo_clicks} Paid={b.payment_successes}</title>
              <rect x={x}             y={H - fvH} width={barW} height={fvH || 1} rx="2" fill="#60a5fa" />
              <rect x={x + barW + gap} y={H - dcH} width={barW} height={dcH || 1} rx="2" fill="#a78bfa" />
              <rect x={x + (barW + gap) * 2} y={H - psH} width={barW} height={psH || 1} rx="2" fill="#34d399" />
              <text x={x + groupW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">{label}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" /> Views</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-400" /> Demo</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Paid</span>
      </div>
    </div>
  );
}

// Horizontal bar for per-form breakdown
function HBarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 truncate text-gray-600 shrink-0" title={label}>{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-gray-700 font-semibold shrink-0">{value}</span>
    </div>
  );
}

const REFRESH_OPTIONS: { label: string; ms: number }[] = [
  { label: 'Disabled', ms: 0       },
  { label: '5s',       ms: 5_000   },
  { label: '30s',      ms: 30_000  },
  { label: '1min',     ms: 60_000  },
  { label: '30min',    ms: 1_800_000 },
];
const REFRESH_STORAGE_KEY = 'qfph_mc_refresh_ms';

function DashboardTab() {
  const [period, setPeriod] = useState<Period>('week');
  const [refreshMs, setRefreshMs] = useState<number>(0);
  const [refreshTick, setRefreshTick] = useState(0); // bump to force a fetch (manual refresh)
  const { data, loading, lastFetchedAt } = useDashboardStats(period, refreshMs, refreshTick);

  // Restore preferred refresh interval from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REFRESH_STORAGE_KEY);
      if (raw !== null) {
        const n = Number(raw);
        if (Number.isFinite(n) && REFRESH_OPTIONS.some((o) => o.ms === n)) {
          setRefreshMs(n);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleRefreshChange = (ms: number) => {
    setRefreshMs(ms);
    try { localStorage.setItem(REFRESH_STORAGE_KEY, String(ms)); } catch { /* ignore */ }
  };

  // "Last updated" relative-time label, refreshed every second so it stays live.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!lastFetchedAt) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [lastFetchedAt]);
  const lastUpdatedLabel = lastFetchedAt
    ? (() => {
        const sec = Math.max(0, Math.floor((Date.now() - lastFetchedAt) / 1000));
        if (sec < 5)   return 'just now';
        if (sec < 60)  return `${sec}s ago`;
        if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
        return `${Math.floor(sec / 3600)}h ago`;
      })()
    : '—';

  const PERIOD_LABELS: Record<Period, string> = { day: 'Today', week: 'This Week', month: 'This Month' };

  const maxViews = Math.max(...(data?.perForm?.map((f) => f.form_views) ?? []), 1);
  const maxDemo  = Math.max(...(data?.perForm?.map((f) => f.demo_clicks) ?? []), 1);

  return (
    <div className="space-y-6">
      {/* Period Filter + Auto-Refresh */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium mr-1">Period:</span>
        {(['day', 'week', 'month'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              period === p ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
        <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-gray-600">
          <span className="font-medium text-gray-500">Total Forms:</span>
          <span className="font-bold text-gray-900">{FORMS.length}</span>
        </span>

        {/* Auto-refresh control — pushed to the right */}
        <div className="ml-auto flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <span className="font-medium text-gray-500">Auto-refresh:</span>
            <select
              value={refreshMs}
              onChange={(e) => handleRefreshChange(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
            >
              {REFRESH_OPTIONS.map((o) => (
                <option key={o.ms} value={o.ms}>{o.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setRefreshTick((n) => n + 1)}
            title="Refresh now"
            className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            aria-label="Refresh now"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <polyline points="21 4 21 10 15 10" />
            </svg>
          </button>
          <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">
            {refreshMs > 0 && <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse align-middle" />}
            {lastUpdatedLabel}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Unique Visitors',    value: loading ? '…' : (data?.uniqueVisitors        ?? 0), icon: '👥', color: 'bg-cyan-50 text-cyan-700'    },
          { label: 'Form Clicks',        value: loading ? '…' : (data?.totalFormViews        ?? 0), icon: '👆', color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Demo Clicks',        value: loading ? '…' : (data?.totalDemoClicks       ?? 0), icon: '🧪', color: 'bg-violet-50 text-violet-700' },
          { label: 'Paid Users',         value: loading ? '…' : (data?.totalPaymentSuccesses ?? 0), icon: '💰', color: 'bg-green-50 text-green-700'  },
          { label: 'Chat Questions',     value: loading ? '…' : (data?.totalChatQuestions    ?? 0), icon: '🤖', color: 'bg-pink-50 text-pink-700'    },
          { label: 'Claimed Codes',      value: loading ? '…' : (data?.claimedCodes          ?? 0), icon: '🏷️', color: 'bg-amber-50 text-amber-700'  },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-gray-200 p-5">
            <div className={`inline-flex rounded-xl p-2 text-lg ${s.color} mb-3`}>{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{PERIOD_LABELS[period]}</div>
          </div>
        ))}
      </div>

      {/* Unclaimed Codes — separate, no period filter */}
      <div className="rounded-2xl bg-white border border-gray-200 px-5 py-4 flex items-center gap-4">
        <span className="text-2xl">🔓</span>
        <div>
          <div className="text-2xl font-bold text-gray-900">{loading ? '…' : (data?.unclaimedCodes ?? 0)}</div>
          <div className="text-xs text-gray-500">Unclaimed Promo Codes (total)</div>
        </div>
      </div>

      {/* Activity Over Time chart */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Activity — Last 30 Days</h2>
        {loading ? (
          <div className="h-24 flex items-center justify-center text-xs text-gray-400">Loading…</div>
        ) : (
          <BarChart buckets={data?.dailyBuckets ?? []} />
        )}
      </div>

      {/* Funnel */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Conversion Funnel — {PERIOD_LABELS[period]}</h2>
        {loading ? (
          <div className="text-xs text-gray-400">Loading…</div>
        ) : (() => {
          const steps = [
            { label: 'Form Clicks (Landing)', value: data?.totalFormViews ?? 0, color: 'bg-blue-500' },
            { label: 'Demo Clicked',          value: data?.totalDemoClicks ?? 0, color: 'bg-violet-500' },
            { label: 'Paid / Redeemed',       value: data?.totalPaymentSuccesses ?? 0, color: 'bg-green-500' },
          ];
          const maxStep = Math.max(...steps.map((s) => s.value), 1);
          return (
            <div className="space-y-3">
              {steps.map((s) => (
                <div key={s.label} className="flex items-center gap-3 text-sm">
                  <span className="w-44 text-xs text-gray-600 shrink-0">{s.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 rounded-full ${s.color} transition-all duration-500`}
                      style={{ width: `${(s.value / maxStep) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-bold text-gray-800 shrink-0">{s.value}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Per-Form breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Forms by Clicks — {PERIOD_LABELS[period]}</h2>
          {loading ? (
            <div className="text-xs text-gray-400">Loading…</div>
          ) : !data?.perForm.length ? (
            <div className="text-xs text-gray-400">No data yet</div>
          ) : (
            <div className="space-y-2">
              {data.perForm.slice(0, 8).map((f) => (
                <HBarRow key={f.slug} label={f.slug} value={f.form_views} max={maxViews} color="bg-blue-400" />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Demo Clicks per Form — {PERIOD_LABELS[period]}</h2>
          {loading ? (
            <div className="text-xs text-gray-400">Loading…</div>
          ) : !data?.perForm.filter((f) => f.demo_clicks > 0).length ? (
            <div className="text-xs text-gray-400">No data yet</div>
          ) : (
            <div className="space-y-2">
              {data.perForm
                .filter((f) => f.demo_clicks > 0)
                .sort((a, b) => b.demo_clicks - a.demo_clicks)
                .slice(0, 8)
                .map((f) => (
                  <HBarRow key={f.slug} label={f.slug} value={f.demo_clicks} max={maxDemo} color="bg-violet-400" />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Catalog Tab ──────────────────────────────────────────────────────────────
function CatalogTab() {
  return (
    <div className="space-y-4">
      {FORMS.map((form) => (
        <div key={form.slug} className="rounded-2xl bg-white border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="text-2xl">📄</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-gray-400">{form.code} · {form.version}</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">{form.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{form.agency} · {form.category}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {form.fields.length} fields
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {form.steps.length} steps
                </span>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  {form.pdfPath}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/forms/${form.slug}`}
                target="_blank"
                className="text-xs text-blue-600 hover:underline"
              >
                Preview
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────
function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [url, setUrl]                 = useState('');
  const [urlFilename, setUrlFilename] = useState('');
  const [importing, setImporting]     = useState(false);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/forms/upload', { method: 'POST', body: fd });
      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        filename?: string;
        path?: string;
        bytes?: number;
        scan?: { inserted: number; updated: number; softDeleted: number };
      };
      if (!res.ok || !data.ok) {
        setResult({ ok: false, text: data.error ?? `Upload failed (${res.status})` });
      } else {
        const kb = Math.round((data.bytes ?? 0) / 1024);
        const s  = data.scan;
        setResult({
          ok: true,
          text:
            `✅ Saved as ${data.path} (${kb} KB). ` +
            `Catalog: +${s?.inserted ?? 0} inserted, ${s?.updated ?? 0} updated. ` +
            `Status: "Soon" (no FormEditor yet).`,
        });
        setFile(null);
        const inputEl = document.getElementById('pdf-upload') as HTMLInputElement | null;
        if (inputEl) inputEl.value = '';
      }
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleRescan() {
    setUploading(true);
    setResult(null);
    try {
      const res  = await fetch('/api/admin/forms/scan', { method: 'POST' });
      const data = await res.json() as { ok?: boolean; error?: string; scanned?: number; inserted?: number; updated?: number; softDeleted?: number };
      if (!res.ok || !data.ok) {
        setResult({ ok: false, text: data.error ?? `Scan failed (${res.status})` });
      } else {
        setResult({
          ok: true,
          text: `🔁 Scanned ${data.scanned} PDFs · +${data.inserted} new · ${data.updated} updated · ${data.softDeleted} removed.`,
        });
      }
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleImportUrl() {
    if (!url.trim()) return;
    setImporting(true);
    setResult(null);
    try {
      const res  = await fetch('/api/admin/forms/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), filename: urlFilename.trim() || undefined }),
      });
      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        diagnostics?: { received_content_type?: string; received_bytes?: number; head_snippet?: string; first_bytes_hex?: string };
        filename?: string;
        path?: string;
        bytes?: number;
        sourceUrl?: string;
        slug?: string;
        agency?: string;
        formCode?: string;
        scan?: { inserted: number; updated: number; softDeleted: number };
      };
      if (!res.ok || !data.ok) {
        const diag = data.diagnostics
          ? ` (content-type: ${data.diagnostics.received_content_type ?? '?'}, ${data.diagnostics.received_bytes ?? 0} B)`
          : '';
        setResult({ ok: false, text: (data.error ?? `Import failed (${res.status})`) + diag });
      } else {
        const kb = Math.round((data.bytes ?? 0) / 1024);
        setResult({
          ok: true,
          text:
            `✅ Imported ${data.path} (${kb} KB) from ${data.sourceUrl}. ` +
            `Slug: ${data.slug}. ` +
            `Catalog: +${data.scan?.inserted ?? 0} inserted, ${data.scan?.updated ?? 0} updated. ` +
            `Status: "Soon" (no FormEditor yet) — source_url saved.`,
        });
        setUrl('');
        setUrlFilename('');
      }
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Upload Government PDF</h2>
        <p className="text-xs text-gray-500 mb-4">
          Saved to <code className="bg-gray-100 px-1 rounded">public/forms/NoFormEditor/</code>{' '}
          and added to the catalog as <strong>Soon</strong>. Promote to a fillable form by
          ingesting via <em>Smart Assistance — Form Intake</em>.
        </p>

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => document.getElementById('pdf-upload')?.click()}
        >
          <div className="text-3xl mb-2">📤</div>
          {file ? (
            <div className="text-sm text-gray-700 font-medium">{file.name}</div>
          ) : (
            <>
              <div className="text-sm text-gray-600">Click to select PDF</div>
              <div className="text-xs text-gray-400 mt-1">
                Max 25 MB · PDF only · name as <code>Agency - Code.pdf</code>
              </div>
            </>
          )}
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {result && (
          <div
            className={
              'mt-3 rounded-xl px-4 py-3 text-xs border ' +
              (result.ok
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800')
            }
          >
            {result.text}
          </div>
        )}

        <button
          className="btn-primary w-full mt-4"
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Uploading…' : '⬆️ Upload to NoFormEditor'}
        </button>

        <button
          type="button"
          className="w-full mt-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-medium py-2.5 disabled:opacity-50"
          onClick={handleRescan}
          disabled={uploading}
        >
          🔁 Rescan public/forms folders
        </button>
      </div>

      {/* Import from URL */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Import from URL</h2>
        <p className="text-xs text-gray-500 mb-4">
          Paste the official PDF URL (e.g. from{' '}
          <code className="bg-gray-100 px-1 rounded">gsis.gov.ph</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">philhealth.gov.ph</code>). The PDF is
          downloaded to <code className="bg-gray-100 px-1 rounded">NoFormEditor/</code> and the
          row's <code>source_url</code> is set automatically.
        </p>

        <label className="block text-[11px] font-semibold text-gray-600 mb-1">PDF URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.gsis.gov.ph/downloads/forms/MPB%20Application%20Form.pdf"
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-blue-500"
          autoComplete="off"
        />

        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
          Save as (optional) <span className="text-gray-400 font-normal">— follow <code>Agency - Code.pdf</code></span>
        </label>
        <input
          type="text"
          value={urlFilename}
          onChange={(e) => setUrlFilename(e.target.value)}
          placeholder="GSIS - MPB Application Form.pdf"
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          autoComplete="off"
        />

        <button
          type="button"
          className="btn-primary w-full mt-4 disabled:opacity-50"
          onClick={handleImportUrl}
          disabled={!url.trim() || importing}
        >
          {importing ? 'Importing…' : '🌐 Fetch & Import'}
        </button>
      </div>

      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5 text-xs text-blue-800">
        <strong>Filename tip:</strong> Use the format{' '}
        <code className="bg-blue-100 px-1 rounded">Agency - Code.pdf</code>{' '}
        (e.g.{' '}
        <code className="bg-blue-100 px-1 rounded">PhilHealth - ClaimForm5.pdf</code>) so the
        scanner can derive a clean slug, agency, and code automatically.
      </div>
    </div>
  );
}

// ─── Storage Config Tab ───────────────────────────────────────────────────────
function StorageConfigTab() {
  const [backend, setBackend] = useState<'local' | 'azure'>('local');
  const [connectionString, setConnectionString] = useState('');
  const [containerName, setContainerName] = useState('quickformsph');
  const [csHint, setCsHint] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/storage-config')
      .then((r) => r.json())
      .then((d: { backend: string; containerName: string; hasConnectionString: boolean; connectionStringHint: string }) => {
        setBackend(d.backend === 'azure' ? 'azure' : 'local');
        setContainerName(d.containerName ?? 'quickformsph');
        setCsHint(d.connectionStringHint ?? '');
      })
      .catch(() => {});
  }, []);

  async function testConnection() {
    setTesting(true);
    setTestResult('');
    try {
      const res = await fetch('/api/admin/storage-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', backend, connectionString, containerName }),
      });
      const d = await res.json() as { ok: boolean; message: string };
      setTestResult(d.message ?? (d.ok ? '✅ Connected' : '❌ Failed'));
    } catch {
      setTestResult('❌ Network error');
    } finally {
      setTesting(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/admin/storage-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', backend, connectionString, containerName }),
      });
      const d = await res.json() as { ok?: boolean; error?: string };
      if (d.ok) {
        setSaveMsg({ ok: true, text: '✅ Configuration saved' });
        if (connectionString) setCsHint(`${connectionString.slice(0, 30)}…`);
        setConnectionString('');
      } else {
        setSaveMsg({ ok: false, text: `❌ ${d.error ?? 'Save failed'}` });
      }
    } catch {
      setSaveMsg({ ok: false, text: '❌ Network error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Storage Backend</h2>
        <p className="text-xs text-gray-500 mb-4">
          Where generated PDFs and uploads are stored. Changes take effect immediately.
        </p>

        <div className="space-y-3">
          {(['local', 'azure'] as const).map((b) => (
            <label
              key={b}
              className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                backend === b ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <input
                type="radio"
                name="backend"
                value={b}
                checked={backend === b}
                onChange={() => setBackend(b)}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {b === 'local' ? '🖥️ Local Filesystem' : '☁️ Azure Blob Storage'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {b === 'local'
                    ? `Stored at ${process.env.UPLOAD_DIR ?? './data/generated-pdfs'} on the server`
                    : 'Stored in Azure Blob — requires connection string'}
                </div>
              </div>
            </label>
          ))}
        </div>

        {backend === 'azure' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="field-label">Azure Blob Connection String</label>
              {csHint && !connectionString && (
                <p className="text-xs text-gray-400 mb-1">Saved: {csHint}</p>
              )}
              <input
                type="password"
                className="input-field"
                placeholder={csHint ? 'Leave blank to keep saved value' : 'DefaultEndpointsProtocol=https;AccountName=…'}
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Container Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="quickformsph"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
              />
            </div>
          </div>
        )}

        {testResult && (
          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-700">
            {testResult}
          </div>
        )}

        {saveMsg && (
          <div className={`mt-3 rounded-xl border px-4 py-3 text-xs ${
            saveMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {saveMsg.text}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            className="btn-secondary flex-1 text-xs py-2"
            onClick={testConnection}
            disabled={testing || saving}
          >
            {testing ? 'Testing…' : '🔌 Test Connection'}
          </button>
          <button
            className="btn-primary flex-1 text-xs py-2"
            onClick={saveConfig}
            disabled={saving || testing}
          >
            {saving ? 'Saving…' : '💾 Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Collapsible Section helper ──────────────────────────────────────────────
const SettingsCollapseCtx = React.createContext<{
  open: string | null;
  setOpen: (id: string | null) => void;
  showAll: boolean;
}>({ open: null, setOpen: () => {}, showAll: false });

function CollapsibleSection({
  id,
  title,
  subtitle,
  rightSlot,
  accent,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  accent?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  const { open, setOpen, showAll } = React.useContext(SettingsCollapseCtx);
  const isOpen = showAll || open === id;
  const danger = accent === 'danger';
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        danger ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(isOpen ? null : id)}
        className={`w-full flex items-center gap-3 px-6 py-4 text-left ${
          danger ? 'hover:bg-red-100/50' : 'hover:bg-gray-50'
        } transition-colors`}
        aria-expanded={isOpen}
      >
        <span
          className={`text-xs transition-transform inline-block w-3 ${
            isOpen ? 'rotate-90' : ''
          } ${danger ? 'text-red-700' : 'text-gray-400'}`}
        >
          ▶
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className={`text-sm font-semibold ${
              danger ? 'text-red-900' : 'text-gray-900'
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`text-xs mt-0.5 ${
                danger ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {rightSlot}
          </div>
        )}
      </button>
      {isOpen && <div className="px-6 pb-6 -mt-1">{children}</div>}
    </div>
  );
}

// ─── AI Assistant (Kuya Quim) Settings Card ──────────────────────────────────
function AIAssistantCard() {
  type AdminView = {
    enabled: boolean;
    provider: 'azure_openai' | 'openai';
    endpoint: string;
    apiKeyMask: string;
    apiKeyFromEnv: boolean;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  const [s, setS] = useState<AdminView | null>(null);
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  // Test button state
  const [testInput, setTestInput] = useState('Anong form ang kailangan ko para mag-apply ng TIN?');
  const [testing, setTesting] = useState(false);
  type TestResult = {
    ok: boolean;
    status?: number;
    latencyMs?: number;
    reply?: string;
    error?: string;
    code?: string | null;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
    finishReason?: string | null;
    sentMessage?: string;
  };
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    fetch('/api/admin/ai-settings')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: AdminView) => setS(d))
      .catch(() => setErr('Failed to load AI settings'));
  }, []);

  async function save(patch: Record<string, unknown>) {
    setSaving(true); setMsg(''); setErr('');
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json() as { ok?: boolean; settings?: AdminView; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Save failed');
      setS(data.settings ?? null);
      setNewKey('');
      setMsg('Saved ✓');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function runTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testInput,
          // Send the currently-typed values so admins can test BEFORE saving.
          overrides: {
            provider: s?.provider,
            endpoint: s?.endpoint,
            model: s?.model,
            maxTokens: s?.maxTokens,
            temperature: s?.temperature,
            ...(newKey ? { apiKey: newKey } : {}),
          },
        }),
      });
      const data = (await res.json()) as TestResult;
      setTestResult(data);
    } catch (e) {
      setTestResult({
        ok: false,
        error: e instanceof Error ? e.message : 'Test request failed',
      });
    } finally {
      setTesting(false);
    }
  }

  if (!s) {
    return <p className="text-xs text-gray-500">{err || 'Loading…'}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-gray-500">
          Configures the LLM used by the chat assistant on the Forms Listing page.
          Access is gated to ₱5 donors.
        </p>
        <label className="inline-flex items-center gap-2 text-xs shrink-0">
          <input
            type="checkbox"
            checked={s.enabled}
            onChange={(e) => save({ enabled: e.target.checked })}
            disabled={saving}
            className="h-4 w-4"
          />
          <span className="font-medium text-gray-700">{s.enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
        <select
          value={s.provider}
          onChange={(e) => setS({ ...s, provider: e.target.value as AdminView['provider'] })}
          className="input-field text-sm"
        >
          <option value="azure_openai">Azure OpenAI</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Endpoint
          <span className="ml-2 text-[10px] font-normal text-gray-400">
            (Azure: full chat-completions URL incl. deployment)
          </span>
        </label>
        <input
          type="text"
          value={s.endpoint}
          onChange={(e) => setS({ ...s, endpoint: e.target.value })}
          placeholder="https://<resource>.openai.azure.com/openai/deployments/<dep>/chat/completions?api-version=2024-08-01-preview"
          className="input-field text-sm font-mono"
        />
      </div>

      {s.provider === 'openai' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
          <input
            type="text"
            value={s.model}
            onChange={(e) => setS({ ...s, model: e.target.value })}
            placeholder="gpt-4o-mini"
            className="input-field text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          API Key
          {s.apiKeyMask && (
            <span className="ml-2 text-[10px] font-mono text-gray-500">
              current: {s.apiKeyMask}{s.apiKeyFromEnv ? ' (from env)' : ''}
            </span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Paste new key to replace, or leave blank to keep"
            className="input-field text-sm flex-1"
            autoComplete="off"
          />
          {s.apiKeyMask && !s.apiKeyFromEnv && (
            <button
              onClick={() => save({ apiKey: '__CLEAR__' })}
              disabled={saving}
              className="text-xs text-red-600 border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Stored encrypted at rest (AES-256-GCM, key derived from FORM_DATA_ENCRYPTION_KEY).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max Tokens</label>
          <input
            type="number"
            min={1}
            max={4000}
            value={s.maxTokens}
            onChange={(e) => setS({ ...s, maxTokens: Number(e.target.value) })}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Temperature</label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={s.temperature}
            onChange={(e) => setS({ ...s, temperature: Number(e.target.value) })}
            className="input-field text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => save({
            provider: s.provider,
            endpoint: s.endpoint,
            model: s.model,
            maxTokens: s.maxTokens,
            temperature: s.temperature,
            ...(newKey ? { apiKey: newKey } : {}),
          })}
          disabled={saving}
          className="btn-primary py-2 px-5 text-xs disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {msg && <span className="text-xs text-green-600">{msg}</span>}
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>

      {/* ── Test panel ── */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700">
            🧪 Test Kuya Quim
          </h3>
          <span className="text-[10px] text-gray-400">
            Bypasses donation gate · admin-only
          </span>
        </div>
        <p className="text-[11px] text-gray-500">
          Sends one message through the configured LLM with the live system prompt and forms catalog. Use this to verify the endpoint and key after changing them.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type a question for Kuya Quim…"
            className="input-field text-sm flex-1"
            disabled={testing}
            maxLength={1000}
          />
          <button
            onClick={runTest}
            disabled={testing || !testInput.trim() || !s.enabled}
            className="text-xs font-semibold rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing…' : 'Run Test'}
          </button>
        </div>

        {testResult && (
          <div
            className={`rounded-xl border p-3 text-xs space-y-2 ${
              testResult.ok
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span
                className={
                  testResult.ok ? 'text-green-700' : 'text-red-700'
                }
              >
                {testResult.ok ? '✓ OK' : '✗ FAIL'}
                {testResult.status != null && ` · HTTP ${testResult.status}`}
                {testResult.latencyMs != null && ` · ${testResult.latencyMs}ms`}
              </span>
              {testResult.usage?.total_tokens != null && (
                <span className="text-gray-500">
                  {testResult.usage.prompt_tokens ?? '?'} in / {testResult.usage.completion_tokens ?? '?'} out / {testResult.usage.total_tokens} total tokens
                </span>
              )}
            </div>

            {testResult.ok ? (
              <>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                  Reply
                </div>
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {testResult.reply || '(empty reply)'}
                </div>
                {testResult.finishReason && testResult.finishReason !== 'stop' && (
                  <div className="text-[10px] text-amber-700">
                    finish_reason: {testResult.finishReason}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-[10px] uppercase tracking-wider text-red-700 font-semibold">
                  Error
                </div>
                <div className="font-mono text-red-800 break-all">
                  {testResult.code ? `[${testResult.code}] ` : ''}
                  {testResult.error || 'Unknown error'}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  // Collapsible-sections state (single-open + Show-All override, persisted)
  const STORAGE_OPEN = 'qfph_mc_settings_open_v1';
  const STORAGE_ALL  = 'qfph_mc_settings_showall_v1';
  const [openSection, setOpenSectionRaw] = useState<string | null>(null);
  const [showAllSections, setShowAllRaw] = useState(false);
  useEffect(() => {
    try {
      const o = localStorage.getItem(STORAGE_OPEN);
      if (o) setOpenSectionRaw(o);
      setShowAllRaw(localStorage.getItem(STORAGE_ALL) === '1');
    } catch { /* ignore */ }
  }, []);
  const setOpenSection = (id: string | null) => {
    setOpenSectionRaw(id);
    try {
      if (id) localStorage.setItem(STORAGE_OPEN, id);
      else localStorage.removeItem(STORAGE_OPEN);
    } catch { /* ignore */ }
  };
  const toggleShowAll = () => {
    const next = !showAllSections;
    setShowAllRaw(next);
    try { localStorage.setItem(STORAGE_ALL, next ? '1' : '0'); } catch { /* ignore */ }
  };

  const [curPw, setCurPw]     = useState('');
  const [newPw, setNewPw]     = useState('');
  const [confirmPw, setConfirm] = useState('');
  const [pwMsg, setPwMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy]   = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  // GCash settings
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashName, setGcashName]     = useState('');
  const [qrUrl, setQrUrl]             = useState<string | null>(null);
  const [mayaQrUrl, setMayaQrUrl]     = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [uploadBusy, setUploadBusy]   = useState(false);
  const [uploadMsg, setUploadMsg]     = useState('');
  const [mayaUploadBusy, setMayaUploadBusy] = useState(false);
  const [mayaUploadMsg, setMayaUploadMsg]   = useState('');
  const [loadError, setLoadError]     = useState('');
  const qrInputRef = useRef<HTMLInputElement>(null);
  const mayaQrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/gcash-settings')
      .then(r => r.json())
      .then((d: { gcash_number: string; gcash_name: string; qr_url: string | null; maya_qr_url?: string | null; payment_mode: 'process' | 'upload_only' }) => {
        setGcashNumber(d.gcash_number ?? '');
        setGcashName(d.gcash_name ?? '');
        setQrUrl(d.qr_url ?? null);
        setMayaQrUrl(d.maya_qr_url ?? null);
      })
      .catch(() => setLoadError('Failed to load GCash settings'));
  }, []);

  async function handleSaveGcash() {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch('/api/admin/gcash-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gcash_number: gcashNumber, gcash_name: gcashName }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setLoadError('Failed to save'); }
    finally { setSaving(false); }
  }

  async function handleQRUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadBusy(true); setUploadMsg('');
    const fd = new FormData();
    fd.append('qr', file);
    try {
      const res = await fetch('/api/admin/gcash-qr', { method: 'POST', body: fd });
      const data = await res.json() as { ok?: boolean; qr_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setQrUrl((data.qr_url ?? '') + '?t=' + Date.now());
      setUploadMsg('QR uploaded successfully!');
    } catch (err) { setUploadMsg(String(err)); }
    finally { setUploadBusy(false); if (qrInputRef.current) qrInputRef.current.value = ''; }
  }

  async function handleRemoveQR() {
    setUploadBusy(true); setUploadMsg('');
    try {
      await fetch('/api/admin/gcash-qr', { method: 'DELETE' });
      setQrUrl(null);
      setUploadMsg('QR removed.');
    } catch { setUploadMsg('Failed to remove QR.'); }
    finally { setUploadBusy(false); }
  }

  async function handleMayaQRUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMayaUploadBusy(true); setMayaUploadMsg('');
    const fd = new FormData();
    fd.append('qr', file);
    try {
      const res = await fetch('/api/admin/maya-qr', { method: 'POST', body: fd });
      const data = await res.json() as { ok?: boolean; maya_qr_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setMayaQrUrl((data.maya_qr_url ?? '') + '?t=' + Date.now());
      setMayaUploadMsg('Maya QR uploaded successfully!');
    } catch (err) { setMayaUploadMsg(String(err)); }
    finally { setMayaUploadBusy(false); if (mayaQrInputRef.current) mayaQrInputRef.current.value = ''; }
  }

  async function handleRemoveMayaQR() {
    setMayaUploadBusy(true); setMayaUploadMsg('');
    try {
      await fetch('/api/admin/maya-qr', { method: 'DELETE' });
      setMayaQrUrl(null);
      setMayaUploadMsg('Maya QR removed.');
    } catch { setMayaUploadMsg('Failed to remove Maya QR.'); }
    finally { setMayaUploadBusy(false); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: 'New passwords do not match.' }); return; }
    if (newPw.length < 8)    { setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return; }
    setPwBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (res.ok) {
        setPwMsg({ ok: true, text: 'Password changed successfully.' });
        setCurPw(''); setNewPw(''); setConfirm('');
      } else {
        setPwMsg({ ok: false, text: data.error ?? 'Failed to change password.' });
      }
    } catch {
      setPwMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <SettingsCollapseCtx.Provider
      value={{ open: openSection, setOpen: setOpenSection, showAll: showAllSections }}
    >
    <div className="max-w-lg space-y-4">
      {/* Banner with Show All toggle */}
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-gray-500">
          Click a section to expand. The last-opened section is remembered.
        </p>
        <button
          type="button"
          onClick={toggleShowAll}
          className={`text-[11px] font-semibold rounded-full border px-3 py-1 transition-colors ${
            showAllSections
              ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-700'
          }`}
        >
          {showAllSections ? '▼ Collapse all' : '▶ Show all'}
        </button>
      </div>

      <CollapsibleSection
        id="password"
        title="Change Password"
        subtitle="Update the admin login password."
      >
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="field-label">Current Password</label>
            <div className="relative">
              <input
                type={showCur ? 'text' : 'password'}
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowCur(!showCur)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {showCur ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="field-label">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="input-field pr-10"
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="field-label">Confirm New Password</label>
            <input
              type={showNew ? 'text' : 'password'}
              value={confirmPw}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-field"
              placeholder="Repeat new password"
              required
              autoComplete="new-password"
            />
          </div>
          {pwMsg && (
            <p className={`text-xs font-medium ${pwMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {pwMsg.ok ? '✓ ' : '✗ '}{pwMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={pwBusy}
            className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
          >
            {pwBusy ? 'Saving…' : '🔑 Update Password'}
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection
        id="ai"
        title="Kuya Quim — AI Assistant"
        subtitle="LLM provider, endpoint, key, and test panel."
      >
        <AIAssistantCard />
      </CollapsibleSection>

      <CollapsibleSection
        id="ewallet"
        title="eWallet Payment Settings"
        subtitle="GCash / Maya account name and number."
      >
        {loadError && <p className="text-xs text-red-600 mb-2">{loadError}</p>}
        <div className="space-y-3">
          <div>
            <label className="field-label">Mobile Number</label>
            <input type="text" value={gcashNumber} onChange={e => setGcashNumber(e.target.value)}
              placeholder="e.g. 0917-551-4822" className="input-field text-sm" />
          </div>
          <div>
            <label className="field-label">Account Name</label>
            <input type="text" value={gcashName} onChange={e => setGcashName(e.target.value)}
              placeholder="e.g. JE****Y JO*N G." className="input-field text-sm" />
          </div>
          <button onClick={handleSaveGcash} disabled={saving}
            className="btn-primary py-2 px-5 text-xs disabled:opacity-50">
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="gcash-qr"
        title="GCash QR Code"
        subtitle="Scannable QR for direct payment."
      >
        {qrUrl ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="GCash QR" className="w-40 h-40 object-contain border border-gray-200 rounded-xl bg-gray-50" />
            <div className="flex gap-2">
              <label className="btn-secondary py-2 px-4 text-xs cursor-pointer">
                Replace QR
                <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleQRUpload} disabled={uploadBusy} />
              </label>
              <button onClick={handleRemoveQR} disabled={uploadBusy}
                className="text-xs text-red-600 border border-red-200 rounded-xl px-4 py-2 hover:bg-red-50 disabled:opacity-50">Remove</button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 py-8 cursor-pointer transition-colors">
            <span className="text-2xl">📷</span>
            <span className="text-xs font-medium text-gray-500">{uploadBusy ? 'Uploading…' : 'Click to upload QR image'}</span>
            <span className="text-[10px] text-gray-400">PNG, JPG, WEBP — max 2 MB</span>
            <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleQRUpload} disabled={uploadBusy} />
          </label>
        )}
        {uploadMsg && (
          <p className={`text-xs mt-2 ${uploadMsg.includes('success') || uploadMsg.includes('removed') ? 'text-green-600' : 'text-red-600'}`}>{uploadMsg}</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="maya-qr"
        title="Maya QR Code"
        subtitle="Alternative scannable QR for Maya payments."
      >
        {mayaQrUrl ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mayaQrUrl} alt="Maya QR" className="w-40 h-40 object-contain border border-gray-200 rounded-xl bg-gray-50" />
            <div className="flex gap-2">
              <label className="btn-secondary py-2 px-4 text-xs cursor-pointer">
                Replace QR
                <input ref={mayaQrInputRef} type="file" accept="image/*" className="hidden" onChange={handleMayaQRUpload} disabled={mayaUploadBusy} />
              </label>
              <button onClick={handleRemoveMayaQR} disabled={mayaUploadBusy}
                className="text-xs text-red-600 border border-red-200 rounded-xl px-4 py-2 hover:bg-red-50 disabled:opacity-50">Remove</button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 py-8 cursor-pointer transition-colors">
            <span className="text-2xl">📷</span>
            <span className="text-xs font-medium text-gray-500">{mayaUploadBusy ? 'Uploading…' : 'Click to upload Maya QR image'}</span>
            <span className="text-[10px] text-gray-400">PNG, JPG, WEBP — max 2 MB</span>
            <input ref={mayaQrInputRef} type="file" accept="image/*" className="hidden" onChange={handleMayaQRUpload} disabled={mayaUploadBusy} />
          </label>
        )}
        {mayaUploadMsg && (
          <p className={`text-xs mt-2 ${mayaUploadMsg.includes('success') || mayaUploadMsg.includes('removed') ? 'text-green-600' : 'text-red-600'}`}>{mayaUploadMsg}</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="env"
        title="Environment Info"
        subtitle="Runtime details (read-only)."
      >
        <div className="space-y-2">
          {[
            ['Environment', 'Development (local DGX)'],
            ['Port', '3400'],
            ['Node', process.version ?? '—'],
            ['Next.js', '14'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-gray-500">{k}</span>
              <span className="font-mono text-gray-700">{v}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="danger"
        title="Danger Zone"
        subtitle="These actions cannot be undone."
        accent="danger"
      >
        <button className="text-xs text-red-600 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-100">
          Clear All Generated PDFs
        </button>
      </CollapsibleSection>
    </div>
    </SettingsCollapseCtx.Provider>
  );
}

// ─── SuggestionsTab ───────────────────────────────────────────────────────────
interface Suggestion {
  id: string;
  name: string;
  email: string;
  suggestion: string;
  created_at: number;
  status: 'pending' | 'reviewed' | 'added';
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  reviewed: { label: 'Reviewed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  added:    { label: 'Added ✓',  cls: 'bg-green-50 text-green-700 border-green-200' },
};

function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]         = useState(true);
  const [bulkBusy, setBulkBusy]       = useState(false);
  const [error, setError]             = useState('');
  const [filter, setFilter]           = useState<'all' | 'pending' | 'reviewed' | 'added'>('all');

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch('/api/suggestions');
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json() as { suggestions: Suggestion[] };
      setSuggestions(data.suggestions ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(id: string, status: string) {
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, status: status as Suggestion['status'] } : s));
    await fetch('/api/suggestions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this suggestion?')) return;
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    await fetch('/api/suggestions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  async function handleDeleteAll() {
    if (!confirm(`Delete all ${suggestions.length} suggestions? This cannot be undone.`)) return;
    setBulkBusy(true);
    await fetch('/api/suggestions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setBulkBusy(false);
    load();
  }

  const displayed = suggestions.filter((s) => filter === 'all' || s.status === filter);
  const counts    = {
    all:      suggestions.length,
    pending:  suggestions.filter((s) => s.status === 'pending').length,
    reviewed: suggestions.filter((s) => s.status === 'reviewed').length,
    added:    suggestions.filter((s) => s.status === 'added').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-900">💡 User Suggestions</h2>
        <div className="flex gap-2">
          <button onClick={load} className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">
            ↻ Refresh
          </button>
          {suggestions.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={bulkBusy}
              className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
            >
              🗑 Delete All
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'reviewed', 'added'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
              filter === f ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f].label} ({counts[f]})
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
          No suggestions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((s) => {
            const meta   = STATUS_LABELS[s.status] ?? STATUS_LABELS.pending;
            const dateStr = new Date(s.created_at).toLocaleDateString('en-PH', {
              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            return (
              <div key={s.id} className="rounded-2xl bg-white border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed">{s.suggestion}</p>
                    <div className="mt-2 flex flex-wrap gap-2 items-center text-xs text-gray-400">
                      {s.name && <span className="font-medium text-gray-600">{s.name}</span>}
                      {s.email && <span>{s.email}</span>}
                      <span>·</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold border rounded-full px-2 py-0.5 ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {(['pending', 'reviewed', 'added'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatus(s.id, st)}
                      disabled={s.status === st}
                      className={`text-xs rounded-lg px-2.5 py-1 border font-medium transition-colors disabled:opacity-40 disabled:cursor-default ${STATUS_LABELS[st].cls} hover:opacity-80`}
                    >
                      {STATUS_LABELS[st].label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="ml-auto text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PaymentRefsTab ───────────────────────────────────────────────────────────
type RefEntry = { ref: string; usedAt: string | null };
type Screenshot = { filename: string; size: number; uploadedAt: string; url: string };

function PaymentRefsTab() {
  const [mode, setMode]           = useState<'process' | 'upload_only'>('process');
  const [modeLoading, setModeLoading] = useState(true);
  const [modeSaving, setModeSaving]   = useState(false);

  // Process Payment state
  const [refs, setRefs]           = useState<RefEntry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [flushing, setFlushing]   = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [storageDir, setStorageDir] = useState('');

  // Upload Only state
  const [screenshots, setScreenshots]   = useState<Screenshot[]>([]);
  const [ssLoading, setSsLoading]       = useState(false);
  const [deletingSs, setDeletingSs]     = useState<string | null>(null);
  const [lightbox, setLightbox]         = useState<string | null>(null);

  async function loadMode() {
    setModeLoading(true);
    const res = await fetch('/api/admin/payment-mode');
    if (res.ok) {
      const d = await res.json() as { payment_mode: 'process' | 'upload_only' };
      setMode(d.payment_mode);
      if (d.payment_mode === 'upload_only') loadScreenshots();
      else loadRefs();
    }
    setModeLoading(false);
  }

  async function saveMode(newMode: 'process' | 'upload_only') {
    setModeSaving(true);
    await fetch('/api/admin/payment-mode', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_mode: newMode }),
    });
    setMode(newMode);
    setModeSaving(false);
    if (newMode === 'upload_only') loadScreenshots(); else loadRefs();
  }

  async function loadRefs() {
    setLoading(true);
    const res = await fetch('/api/admin/payment-refs');
    if (res.ok) {
      const data = await res.json() as { refs: RefEntry[]; dir: string };
      setRefs(data.refs); setStorageDir(data.dir);
    }
    setLoading(false);
  }

  async function loadScreenshots() {
    setSsLoading(true);
    const res = await fetch('/api/admin/payment-screenshots');
    if (res.ok) {
      const data = await res.json() as { screenshots: Screenshot[] };
      setScreenshots(data.screenshots);
    }
    setSsLoading(false);
  }

  useEffect(() => { loadMode(); }, []);

  async function handleDelete(ref: string) {
    if (!confirm(`Delete ref ${ref}?`)) return;
    setDeleting(ref);
    await fetch('/api/admin/payment-refs', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref }),
    });
    setDeleting(null); loadRefs();
  }

  async function handleFlushAll() {
    if (!confirm(`Delete ALL ${refs.length} reference numbers? This allows them to be reused.`)) return;
    setFlushing(true);
    await fetch('/api/admin/payment-refs', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setFlushing(false); loadRefs();
  }

  async function handleDeleteSs(filename: string) {
    if (!confirm(`Delete screenshot ${filename}?`)) return;
    setDeletingSs(filename);
    await fetch('/api/admin/payment-screenshots', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    setDeletingSs(null); loadScreenshots();
  }

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  if (modeLoading) return <div className="text-sm text-gray-400 py-10 text-center">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Header + mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">💳 Payments</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage payment mode and records</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="text-xs font-semibold text-gray-600 mb-3">Payment Mode</div>
        <div className="flex gap-3 flex-wrap">
          {(['process', 'upload_only'] as const).map((m) => (
            <button
              key={m}
              onClick={() => saveMode(m)}
              disabled={modeSaving}
              className={`flex-1 min-w-[140px] rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                mode === m
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              {m === 'process' ? '🔍 Process Payment' : '📤 Upload Only'}
              {mode === m && <span className="ml-2 text-[10px] font-bold bg-blue-600 text-white rounded-full px-1.5 py-0.5">ACTIVE</span>}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          {mode === 'process'
            ? 'GCash screenshot is verified via OCR — ref no., amount, and mobile number are validated.'
            : 'Screenshot is saved without validation. User is granted access immediately after upload.'}
        </p>
      </div>

      {/* Process Payment: Refs list */}
      {mode === 'process' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs font-semibold text-gray-700">Used Ref Numbers <span className="text-gray-400 font-normal">— {refs.length} stored</span></div>
              {storageDir && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{storageDir}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={loadRefs} disabled={loading}
                className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40">
                🔄 Refresh
              </button>
              {refs.length > 0 && (
                <button onClick={handleFlushAll} disabled={flushing}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40">
                  {flushing ? 'Flushing…' : `🗑 Flush All (${refs.length})`}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
          ) : refs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              No used reference numbers yet.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Ref No.</th>
                    <th className="px-4 py-2.5 text-left">Used At</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {refs.map((r) => (
                    <tr key={r.ref} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">{r.ref}</td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {r.usedAt
                          ? new Date(r.usedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => handleDelete(r.ref)} disabled={deleting === r.ref}
                          className="text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 disabled:opacity-40">
                          {deleting === r.ref ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
          </table>
        </div>
      )}
        </div>
      )}

      {/* Upload Only: Screenshots list */}
      {mode === 'upload_only' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-semibold text-gray-700">
              Payment Screenshots <span className="text-gray-400 font-normal">— {screenshots.length} uploaded</span>
            </div>
            <button onClick={loadScreenshots} disabled={ssLoading}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40">
              🔄 Refresh
            </button>
          </div>

          {ssLoading ? (
            <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
          ) : screenshots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              No screenshots uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {screenshots.map((s) => (
                <div key={s.filename} className="rounded-xl border border-gray-200 overflow-hidden bg-white group relative">
                  {/* Thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.url}
                    alt={s.filename}
                    className="w-full aspect-[3/4] object-cover cursor-zoom-in bg-gray-100"
                    onClick={() => setLightbox(s.url)}
                  />
                  <div className="p-2">
                    <div className="text-[10px] text-gray-500 truncate">{s.filename}</div>
                    <div className="text-[10px] text-gray-400 flex items-center justify-between gap-1 mt-0.5">
                      <span>{fmtSize(s.size)}</span>
                      <span>{new Date(s.uploadedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSs(s.filename)}
                    disabled={deletingSs === s.filename}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-40"
                    title="Delete"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Payment screenshot"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white text-lg font-bold hover:bg-white/20 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >✕</button>
        </div>
      )}
    </div>
  );
}

// ─── SecurityTab ─────────────────────────────────────────────────────────────

type SecurityStats = {
  blockedIPCount: number;
  rateLimitHits24h: number;
  failedLogins24h: number;
  lastEventTs: string | null;
};

type BlockEntry = {
  ip: string;
  reason: string;
  blockedAt: string;
  source: 'manual' | 'auto';
};

type AuditEvent = {
  id: string;
  type: string;
  ip: string;
  detail: string;
  ts: string;
};

const EVENT_BADGE: Record<string, { label: string; cls: string }> = {
  login_success:   { label: 'Login OK',     cls: 'bg-green-50 text-green-700 border-green-200' },
  login_fail:      { label: 'Login Fail',   cls: 'bg-red-50 text-red-700 border-red-200' },
  login_lockout:   { label: 'Lockout',      cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  logout:          { label: 'Logout',       cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  rate_limit_hit:  { label: 'Rate Limit',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ip_blocked:      { label: 'IP Blocked',   cls: 'bg-red-50 text-red-700 border-red-200' },
  ip_unblocked:    { label: 'IP Unblocked', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  upload_attempt:  { label: 'Upload',       cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  admin_action:    { label: 'Admin',        cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  request_blocked: { label: 'Req Blocked',  cls: 'bg-red-100 text-red-800 border-red-300' },
};

function SecurityTab() {
  const [stats, setStats]           = useState<SecurityStats | null>(null);
  const [blocklist, setBlocklist]   = useState<BlockEntry[]>([]);
  const [events, setEvents]         = useState<AuditEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [panel, setPanel]           = useState<'overview' | 'blocklist' | 'audit'>('overview');
  const [blockIPVal, setBlockIPVal] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking]     = useState(false);
  const [blockMsg, setBlockMsg]     = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security');
      if (res.ok) {
        const data = await res.json() as {
          stats: SecurityStats;
          blocklist: BlockEntry[];
          events: AuditEvent[];
        };
        setStats(data.stats);
        setBlocklist(data.blocklist);
        setEvents(data.events);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleBlock() {
    if (!blockIPVal.trim()) return;
    setBlocking(true);
    setBlockMsg('');
    const res = await fetch('/api/admin/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: blockIPVal.trim(), reason: blockReason.trim() || 'Manual block' }),
    });
    if (res.ok) {
      setBlockIPVal('');
      setBlockReason('');
      setBlockMsg(`✅ ${blockIPVal.trim()} blocked`);
      load();
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setBlockMsg(`❌ ${d.error ?? 'Failed'}`);
    }
    setBlocking(false);
  }

  async function handleUnblock(ip: string) {
    if (!confirm(`Unblock ${ip}?`)) return;
    await fetch('/api/admin/security', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
    load();
  }

  const subPanels = [
    { id: 'overview',  label: 'Overview' },
    { id: 'blocklist', label: `Blocklist (${blocklist.length})` },
    { id: 'audit',     label: `Audit Log (${events.length})` },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">🛡️ Security</h2>
          <p className="text-xs text-gray-500 mt-0.5">Rate limiting, IP blocklist, and audit trail</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Sub-panel tabs */}
      <div className="flex gap-2 flex-wrap">
        {subPanels.map((p) => (
          <button
            key={p.id}
            onClick={() => setPanel(p.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              panel === p.id
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>}

      {/* ── Overview ── */}
      {!loading && panel === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Blocked IPs',         value: stats?.blockedIPCount ?? 0,    icon: '🚫', color: 'bg-red-50 text-red-700' },
              { label: 'Rate Limit Hits 24h', value: stats?.rateLimitHits24h ?? 0,  icon: '⚡', color: 'bg-amber-50 text-amber-700' },
              { label: 'Failed Logins 24h',   value: stats?.failedLogins24h ?? 0,   icon: '🔐', color: 'bg-orange-50 text-orange-700' },
              {
                label: 'Last Event',
                value: stats?.lastEventTs
                  ? new Date(stats.lastEventTs).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
                  : '—',
                icon: '📋', color: 'bg-blue-50 text-blue-700',
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white border border-gray-200 p-5">
                <div className={`inline-flex rounded-xl p-2 text-lg ${s.color} mb-3`}>{s.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Protections</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                ['Rate Limiting',       'Per-IP sliding window on all public endpoints'],
                ['Brute-Force Lockout', '5 failed logins → 15 min IP lockout'],
                ['Auto IP Block',       '3 lockout episodes/hour → permanent block'],
                ['Security Headers',    'CSP, HSTS, X-Frame-Options, X-Content-Type'],
                ['Input Sanitization',  'HTML strip + slug validation on all inputs'],
                ['File Upload Guards',  'Magic-byte check + MIME type + 10 MB cap'],
                ['Cookie Hardening',    'httpOnly, Secure, SameSite=Strict on session'],
                ['Audit Logging',       'All auth & security events logged with IP'],
              ].map(([name, desc]) => (
                <div key={name} className="flex items-start gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5">
                  <span className="text-green-600 text-xs mt-0.5">✓</span>
                  <div>
                    <div className="text-xs font-semibold text-green-900">{name}</div>
                    <div className="text-[11px] text-green-700 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Blocklist ── */}
      {!loading && panel === 'blocklist' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Block an IP Address</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="IP address (e.g. 1.2.3.4)"
                value={blockIPVal}
                onChange={(e) => setBlockIPVal(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Reason (optional)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleBlock}
                disabled={blocking || !blockIPVal.trim()}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl px-4 py-2 disabled:opacity-40"
              >
                {blocking ? 'Blocking…' : '🚫 Block'}
              </button>
            </div>
            {blockMsg && <p className="mt-2 text-xs text-gray-600">{blockMsg}</p>}
          </div>

          {blocklist.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              No IPs are currently blocked.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5 text-left">IP Address</th>
                    <th className="px-4 py-2.5 text-left">Source</th>
                    <th className="px-4 py-2.5 text-left">Reason</th>
                    <th className="px-4 py-2.5 text-left">Blocked At</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blocklist.map((e) => (
                    <tr key={e.ip} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">{e.ip}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${
                          e.source === 'auto'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>{e.source}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">{e.reason}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                        {new Date(e.blockedAt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleUnblock(e.ip)}
                          className="text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 text-[11px]"
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Audit Log ── */}
      {!loading && panel === 'audit' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              No security events recorded yet.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Time</th>
                    <th className="px-4 py-2.5 text-left">Type</th>
                    <th className="px-4 py-2.5 text-left">IP</th>
                    <th className="px-4 py-2.5 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map((e) => {
                    const badge = EVENT_BADGE[e.type] ?? { label: e.type, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
                    return (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                          {new Date(e.ts).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-gray-700">{e.ip}</td>
                        <td className="px-4 py-2.5 text-gray-600">{e.detail}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── GeneratedPDFsTab ─────────────────────────────────────────────────────────
type PDFEntry = {
  code: string;
  full_name: string;
  form_name: string;
  form_code: string;
  agency: string;
  ref_no: string | null;
  amount: number | null;
  created_at: number | null;
  expires_at: number | null;
  expired: boolean;
};

function PDFPreviewModal({ code, name, onClose }: { code: string; name: string; onClose: () => void }) {
  const [fullscreen, setFullscreen] = useState(false);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const previewUrl = `/api/preview/${code}`;
  const downloadUrl = `/api/download/${code}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 text-white text-sm shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold truncate max-w-[280px]">{name}</span>
          <span className="text-gray-400 font-mono text-xs">{code}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            download
            className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 font-semibold"
          >
            ⬇ Download
          </a>
          <button
            onClick={() => setFullscreen((f) => !f)}
            className="text-xs border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 rounded-lg px-3 py-1.5"
          >
            {fullscreen ? '⊡ Exit Fullscreen' : '⊞ Fullscreen'}
          </button>
          <button
            onClick={onClose}
            className="text-xs border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 rounded-lg px-3 py-1.5"
          >
            ✕ Close
          </button>
        </div>
      </div>
      {/* PDF iframe */}
      <div className={`flex-1 overflow-hidden ${fullscreen ? 'fixed inset-0 z-50 pt-0' : ''}`}>
        {fullscreen && (
          <div className="absolute top-2 right-2 z-50 flex gap-2">
            <a
              href={downloadUrl}
              download
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 font-semibold shadow-lg"
            >
              ⬇ Download
            </a>
            <button
              onClick={() => setFullscreen(false)}
              className="text-xs bg-gray-800/90 text-white rounded-lg px-3 py-1.5 shadow-lg"
            >
              ⊡ Exit Fullscreen
            </button>
          </div>
        )}
        <iframe
          src={previewUrl}
          title={`Preview – ${name}`}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}

function GeneratedPDFsTab() {
  const [entries, setEntries]       = useState<PDFEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [bulkBusy, setBulkBusy]     = useState(false);
  const [storageDir, setStorageDir] = useState('');
  const [preview, setPreview]       = useState<{ code: string; full_name: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/generated-pdfs');
    if (res.ok) {
      const data = await res.json() as { entries: PDFEntry[]; dir: string };
      setEntries(data.entries);
      setStorageDir(data.dir);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(code: string) {
    if (!confirm(`Delete entry for code ${code}? The user will no longer be able to re-download.`)) return;
    setDeleting(code);
    await fetch('/api/admin/generated-pdfs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    setDeleting(null);
    load();
  }

  async function handleDeleteExpired() {
    const expiredCount = entries.filter((e) => e.expired).length;
    if (expiredCount === 0) return;
    if (!confirm(`Delete ${expiredCount} expired entries?`)) return;
    setBulkBusy(true);
    await fetch('/api/admin/generated-pdfs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expired: true }),
    });
    setBulkBusy(false);
    load();
  }

  async function handleDeleteAll() {
    if (!confirm(`Delete ALL ${entries.length} entries? Users with active codes will lose access.`)) return;
    setBulkBusy(true);
    await fetch('/api/admin/generated-pdfs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setBulkBusy(false);
    load();
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? entries.filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.form_name.toLowerCase().includes(q) ||
          e.form_code.toLowerCase().includes(q) ||
          e.agency.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          (e.ref_no ?? '').toLowerCase().includes(q),
      )
    : entries;

  const expiredCount = entries.filter((e) => e.expired).length;

  return (
    <div className="space-y-5">
      {/* PDF Preview Modal */}
      {preview && (
        <PDFPreviewModal
          code={preview.code}
          name={preview.full_name}
          onClose={() => setPreview(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Generated PDFs</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {entries.length} total · {expiredCount} expired
          </p>
          {storageDir && (
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{storageDir}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
          >
            🔄 Refresh
          </button>
          {expiredCount > 0 && (
            <button
              onClick={handleDeleteExpired}
              disabled={bulkBusy}
              className="text-xs border border-orange-300 text-orange-700 rounded-lg px-3 py-1.5 hover:bg-orange-50 disabled:opacity-40"
            >
              🗑 Clear Expired ({expiredCount})
            </button>
          )}
          {entries.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={bulkBusy}
              className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
            >
              🗑 Delete All
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, form, agency, or code…"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          {q ? 'No results match your search.' : 'No generated PDFs yet.'}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-left">Form</th>
                <th className="px-4 py-2.5 text-left">Ref No.</th>
                <th className="px-4 py-2.5 text-right">Amount (₱)</th>
                <th className="px-4 py-2.5 text-left">Created</th>
                <th className="px-4 py-2.5 text-left">Expires</th>
                <th className="px-4 py-2.5 text-left">Code</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((e) => (
                <tr key={e.code} className={`hover:bg-gray-50 ${e.expired ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{e.full_name}</td>
                  <td className="px-4 py-2.5 text-gray-600">
                    <div className="font-semibold">{e.form_code}</div>
                    <div className="text-gray-400 text-[10px]">{e.agency}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700 whitespace-nowrap">{e.ref_no ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700 whitespace-nowrap">
                    {e.amount != null ? `₱${e.amount.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                    {e.created_at
                      ? new Date(e.created_at).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {e.expired ? (
                      <span className="text-red-500 font-semibold">Expired</span>
                    ) : e.expires_at ? (
                      <span className="text-gray-500">
                        {new Date(e.expires_at).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700 tracking-widest">{e.code}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex gap-2 justify-end">
                      {!e.expired && (
                        <>
                          <button
                            onClick={() => setPreview({ code: e.code, full_name: e.full_name })}
                            className="text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50"
                          >
                            👁 Preview
                          </button>
                          <a
                            href={`/api/download/${e.code}`}
                            download
                            className="text-green-700 hover:text-green-900 border border-green-200 rounded-lg px-2.5 py-1 hover:bg-green-50"
                          >
                            ⬇ Download
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(e.code)}
                        disabled={deleting === e.code}
                        className="text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 disabled:opacity-40"
                      >
                        {deleting === e.code ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── License Keys Tab ─────────────────────────────────────────────────────────
interface LicenseKeyRow {
  id: number;
  key_code: string;
  label: string;
  used_at: number | null;
  used_by_ip: string | null;
  created_at: number;
}

function LicenseKeysTab() {
  const [keys, setKeys]       = useState<LicenseKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount]     = useState(1);
  const [label, setLabel]     = useState('');
  const [expiryHours, setExpiryHours] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [copied, setCopied]   = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/license-keys')
      .then((r) => r.json())
      .then((d: { keys: LicenseKeyRow[] }) => { setKeys(d.keys ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    await fetch('/api/admin/license-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, label, expiry_hours: expiryHours === '' ? null : expiryHours }),
    });
    setLabel('');
    setCount(1);
    load();
    setCreating(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this promo code?')) return;
    setDeleting(id);
    await fetch(`/api/admin/license-keys?id=${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const unused  = keys.filter((k) => !k.used_at);
  const used    = keys.filter((k) => k.used_at);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">🏷️ Promo Codes</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Generate promo codes to give users 24-hour access without GCash payment.
        </p>
      </div>

      {/* Generator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Generate Promo Codes</h3>
        <div className="flex gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-500">Count</label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[11px] text-gray-500">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Batch 1, Launch promo…"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-500">Expiry (hours, blank = never)</label>
            <input
              type="number"
              min={1}
              value={expiryHours}
              onChange={(e) => setExpiryHours(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
              placeholder="24"
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm px-5 py-2"
            >
              {creating ? 'Creating…' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-3 text-sm">
        <span className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-1.5 font-medium">
          {unused.length} unused
        </span>
        <span className="bg-gray-100 border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 font-medium">
          {used.length} used
        </span>
      </div>

      {/* Keys table */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-gray-400">No promo codes yet. Generate some above.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Key</th>
                <th className="px-4 py-3 text-left">Label</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Expires</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {keys.map((k) => (
                <tr key={k.id} className={k.used_at ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{k.key_code}</td>
                  <td className="px-4 py-3 text-gray-500">{k.label || '—'}</td>
                  <td className="px-4 py-3">
                    {k.used_at ? (
                      <span className="text-red-500 font-semibold">Used</span>
                    ) : (
                      <span className="text-green-600 font-semibold">Available</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {(k as LicenseKeyRow & { expires_at?: number | null }).expires_at
                      ? (() => { const diff = ((k as LicenseKeyRow & { expires_at?: number | null }).expires_at as number) - Date.now(); return diff <= 0 ? <span className="text-red-500">Expired</span> : <span>{Math.ceil(diff / 3600000)}h left</span>; })()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {!k.used_at && (
                        <button
                          onClick={() => copyKey(k.key_code)}
                          className="text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50"
                        >
                          {copied === k.key_code ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(k.id)}
                        disabled={deleting === k.id}
                        className="text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 disabled:opacity-40"
                      >
                        {deleting === k.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Referral Program Tab ─────────────────────────────────────────────────────
function ReferralProgramTab() {
  const [config, setConfig]       = useState<{ required_referrals: number; promo_expiry_hours: number } | null>(null);
  const [stats, setStats]         = useState<{ email: string; count: number; earned_codes: number }[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');
  const [reqVal, setReqVal]       = useState('');
  const [expVal, setExpVal]       = useState('');

  const load = () => {
    fetch('/api/admin/referral-config').then((r) => r.json()).then((d) => {
      setConfig(d);
      setReqVal(String(d.required_referrals ?? 5));
      setExpVal(String(d.promo_expiry_hours ?? 24));
    });
    fetch('/api/admin/referral-stats').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setStats(d);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    const res = await fetch('/api/admin/referral-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ required_referrals: Number(reqVal), promo_expiry_hours: Number(expVal) }),
    });
    setSaving(false);
    if (res.ok) { setSaveMsg('Saved!'); load(); setTimeout(() => setSaveMsg(''), 2000); }
    else { setSaveMsg('Error saving.'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">🤝 Referral Program</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure how the referral program works and view referral stats.
        </p>
      </div>

      {/* Config */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Program Settings</h3>
        {!config ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500">Referrals needed for 1 promo code</label>
              <input
                type="number"
                min={1}
                value={reqVal}
                onChange={(e) => setReqVal(e.target.value)}
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500">Promo code expiry (hours)</label>
              <input
                type="number"
                min={1}
                value={expVal}
                onChange={(e) => setExpVal(e.target.value)}
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm px-5 py-2"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {saveMsg && <div className="self-end text-xs text-green-600 font-semibold">{saveMsg}</div>}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Referrer Stats</h3>
          <button onClick={load} className="text-xs text-blue-600 hover:underline">Refresh</button>
        </div>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-400">No referrals yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-center">Referrals</th>
                  <th className="px-4 py-3 text-center">Promo Codes Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {stats.map((s) => (
                  <tr key={s.email}>
                    <td className="px-4 py-3 text-gray-700 font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-700">{s.count}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-700">{s.earned_codes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Docs Tab ─────────────────────────────────────────────────────────────────
function DocsTab() {
  const [manifest, setManifest] = useState<{ label: string; file: string }[]>([]);
  const [selected, setSelected] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/docs')
      .then((r) => r.json())
      .then((d) => {
        if (d.docs) {
          setManifest(d.docs);
          setSelected(d.docs[0]?.file ?? '');
        }
      })
      .catch(() => setError('Could not load doc list'));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setContent(null);
    setError('');
    fetch(`/api/admin/docs?file=${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        // Convert markdown to HTML via marked (loaded dynamically)
        import('marked').then(({ marked }) => {
          setContent(marked.parse(d.content) as string);
        });
      })
      .catch(() => setError('Could not load document'))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-base font-semibold text-gray-800">📚 Documentation</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {manifest.map((d) => (
            <option key={d.file} value={d.file}>{d.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-12 justify-center">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading…
        </div>
      )}

      {content && !loading && (
        <div
          className="prose prose-sm prose-gray max-w-none bg-white border border-gray-200 rounded-xl p-6 overflow-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
}

// ─── Forms CRUD Tab ───────────────────────────────────────────────────────────
// CRUD over the SQLite `forms` table (see src/lib/db.ts).
// List → edit modal → soft-delete / restore. Idempotent rescan available
// from the Upload tab.

interface FormRow {
  id: number;
  slug: string;
  form_code: string;
  form_name: string;
  agency: string;
  pdf_path: string;
  source_url: string | null;
  has_form_editor: 0 | 1;
  is_old_form_reported: 0 | 1;
  up_vote: number;
  is_paid: 0 | 1;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

function FormsCrudTab() {
  const [rows, setRows]               = useState<FormRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [agencyFilter, setAgencyFilter] = useState<string>('');
  const [search, setSearch]           = useState('');
  const [editing, setEditing]         = useState<FormRow | null>(null);
  const [toast, setToast]             = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/forms${includeDeleted ? '?includeDeleted=1' : ''}`);
      const data = await res.json() as { ok: boolean; rows?: FormRow[]; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRows(data.rows ?? []);
    } catch (err) {
      setToast({ ok: false, text: err instanceof Error ? err.message : 'Load failed' });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [includeDeleted]);

  const agencies = Array.from(new Set(rows.map((r) => r.agency))).sort();
  const filtered = rows.filter((r) => {
    if (agencyFilter && r.agency !== agencyFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.form_name.toLowerCase().includes(q) &&
          !r.form_code.toLowerCase().includes(q) &&
          !r.slug.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleDelete(slug: string) {
    if (!confirm(`Soft-delete "${slug}"? Counters preserved; restore later from this tab.`)) return;
    const res = await fetch(`/api/admin/forms/${encodeURIComponent(slug)}`, { method: 'DELETE' });
    const d   = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || !d.ok) {
      setToast({ ok: false, text: d.error ?? 'Delete failed' });
    } else {
      setToast({ ok: true, text: `🗑 Soft-deleted ${slug}` });
      load();
    }
  }

  async function handleRestore(slug: string) {
    const res = await fetch(`/api/admin/forms/${encodeURIComponent(slug)}/restore`, { method: 'POST' });
    const d   = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || !d.ok) {
      setToast({ ok: false, text: d.error ?? 'Restore failed' });
    } else {
      setToast({ ok: true, text: `♻️ Restored ${slug}` });
      load();
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, code, or slug…"
          className="flex-1 min-w-[180px] text-xs border border-gray-200 rounded-lg px-3 py-2"
        />
        <select
          value={agencyFilter}
          onChange={(e) => setAgencyFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-2"
        >
          <option value="">All agencies</option>
          {agencies.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          Show deleted
        </label>
        <button
          onClick={load}
          className="text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2"
        >
          🔄 Refresh
        </button>
        <span className="text-[11px] text-gray-400 ml-auto">{filtered.length} of {rows.length} rows</span>
      </div>

      {toast && (
        <div className={`rounded-xl px-4 py-2 text-xs border ${toast.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {toast.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Form</th>
              <th className="px-3 py-2 text-left">Agency</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-center">Editor</th>
              <th className="px-3 py-2 text-center">Old?</th>
              <th className="px-3 py-2 text-center">Paid</th>
              <th className="px-3 py-2 text-right">Upvotes</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No forms.</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className={`border-t border-gray-100 ${r.deleted_at ? 'opacity-50' : ''}`}>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{r.form_name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{r.slug}</div>
                </td>
                <td className="px-3 py-2 text-gray-700">{r.agency}</td>
                <td className="px-3 py-2 font-mono text-gray-600">{r.form_code}</td>
                <td className="px-3 py-2 text-center">
                  {r.has_form_editor
                    ? <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-semibold">LIVE</span>
                    : <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-semibold">SOON</span>}
                </td>
                <td className="px-3 py-2 text-center">{r.is_old_form_reported ? '🟠' : '—'}</td>
                <td className="px-3 py-2 text-center">{r.is_paid ? '💰' : '—'}</td>
                <td className="px-3 py-2 text-right font-semibold text-gray-700">{r.up_vote}</td>
                <td className="px-3 py-2 max-w-[180px] truncate">
                  {r.source_url
                    ? <a href={r.source_url} target="_blank" rel="noreferrer noopener" className="text-blue-600 hover:underline">{new URL(r.source_url).hostname}</a>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {r.deleted_at ? (
                    <button onClick={() => handleRestore(r.slug)} className="text-[11px] text-green-700 hover:underline">Restore</button>
                  ) : (
                    <>
                      <button onClick={() => setEditing(r)} className="text-[11px] text-blue-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => handleDelete(r.slug)} className="text-[11px] text-red-600 hover:underline">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <FormEditModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEditing(null);
            setRows((prev) => prev.map((p) => p.slug === updated.slug ? updated : p));
            setToast({ ok: true, text: `✏️ Saved ${updated.slug}` });
          }}
        />
      )}
    </div>
  );
}

function FormEditModal({
  row,
  onClose,
  onSaved,
}: {
  row: FormRow;
  onClose: () => void;
  onSaved: (r: FormRow) => void;
}) {
  const [formName,    setFormName]    = useState(row.form_name);
  const [agency,      setAgency]      = useState(row.agency);
  const [sourceUrl,   setSourceUrl]   = useState(row.source_url ?? '');
  const [hasEditor,   setHasEditor]   = useState<boolean>(Boolean(row.has_form_editor));
  const [isOld,       setIsOld]       = useState<boolean>(Boolean(row.is_old_form_reported));
  const [isPaid,      setIsPaid]      = useState<boolean>(Boolean(row.is_paid));
  const [upVote,      setUpVote]      = useState<number>(row.up_vote);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string>('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(row.slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_name: formName,
          agency,
          source_url: sourceUrl.trim() || null,
          has_form_editor: hasEditor ? 1 : 0,
          is_old_form_reported: isOld ? 1 : 0,
          is_paid: isPaid ? 1 : 0,
          up_vote: Number(upVote) || 0,
        }),
      });
      const d = await res.json() as { ok?: boolean; row?: FormRow; error?: string };
      if (!res.ok || !d.ok || !d.row) throw new Error(d.error ?? `HTTP ${res.status}`);
      onSaved(d.row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Edit form</h3>
            <p className="text-[11px] text-gray-400 font-mono">{row.slug}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        <Field label="Form name">
          <input value={formName} onChange={(e) => setFormName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Agency">
          <input value={agency} onChange={(e) => setAgency(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Source URL (official PDF)">
          <input
            type="url"
            value={sourceUrl}
            placeholder="https://www.philhealth.gov.ph/downloads/…"
            onChange={(e) => setSourceUrl(e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Toggle label="Has FormEditor" checked={hasEditor} onChange={setHasEditor} />
          <Toggle label="Old form reported" checked={isOld} onChange={setIsOld} />
          <Toggle label="Paid form" checked={isPaid} onChange={setIsPaid} />
        </div>

        <Field label="Upvotes">
          <input
            type="number"
            min={0}
            value={upVote}
            onChange={(e) => setUpVote(Math.max(0, Number(e.target.value) || 0))}
            className={inputCls}
          />
        </Field>

        <div className="text-[10px] text-gray-400">
          Read-only: <span className="font-mono">{row.form_code}</span> ·{' '}
          PDF: <span className="font-mono">{row.pdf_path}</span>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary text-xs px-4 py-2">{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex flex-col items-start gap-1 text-[11px] text-gray-600 cursor-pointer">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}
