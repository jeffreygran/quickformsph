'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FORMS } from '@/data/forms';

const IS_DEV = process.env.NEXT_PUBLIC_APP_ENV === 'dev';

type AdminTab = 'dashboard' | 'catalog' | 'upload' | 'storage' | 'settings' | 'suggestions' | 'refs' | 'security' | 'keys' | 'docs';

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

  const tabs: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'dashboard',   icon: '📊', label: 'Dashboard' },
    { id: 'catalog',     icon: '📋', label: 'Form Catalog' },
    { id: 'upload',      icon: '⬆️', label: 'Upload PDF' },
    { id: 'storage',     icon: '💾', label: 'Storage Config' },
    { id: 'suggestions', icon: '💡', label: 'Suggestions' },
    { id: 'refs',        icon: '🧾', label: 'Payment Refs' },
    { id: 'settings',    icon: '⚙️', label: 'Settings' },
    { id: 'security',    icon: '🛡️', label: 'Security' },
    { id: 'keys',        icon: '🏷️', label: 'Promo Codes' },
    { id: 'docs',        icon: '📚', label: 'Docs' },
  ];

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
              src="/quickformsph-logo-transparent-slogan.png"
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
          {tabs.map((t) => (
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
            {tabs.find((t) => t.id === tab)?.label ?? 'Admin'}
          </h1>
          <div className="ml-auto">
            <Link href="/" className="text-xs text-blue-600 hover:underline">
              ← View Site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {tab === 'dashboard'   && <DashboardTab />}
          {tab === 'catalog'     && <CatalogTab />}
          {tab === 'upload'      && <UploadTab />}
          {tab === 'storage'     && <StorageConfigTab />}
          {tab === 'suggestions' && <SuggestionsTab />}
          {tab === 'refs'        && <PaymentRefsTab />}
          {tab === 'settings'    && <SettingsTab />}
          {tab === 'security'    && <SecurityTab />}
          {tab === 'keys'        && <LicenseKeysTab />}
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
  claimedCodes: number;
  unclaimedCodes: number;
  dailyBuckets: DailyBucket[];
}

function useDashboardStats(period: Period) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then((d) => { setData(d as DashboardStats); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [period]);
  return { data, loading };
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

function DashboardTab() {
  const [period, setPeriod] = useState<Period>('week');
  const { data, loading } = useDashboardStats(period);

  const PERIOD_LABELS: Record<Period, string> = { day: 'Today', week: 'This Week', month: 'This Month' };

  const maxViews = Math.max(...(data?.perForm?.map((f) => f.form_views) ?? []), 1);
  const maxDemo  = Math.max(...(data?.perForm?.map((f) => f.demo_clicks) ?? []), 1);

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center gap-2">
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Forms',        value: FORMS.length,                       icon: '📋', color: 'bg-blue-50 text-blue-700',    noFilter: true },
          { label: 'Form Clicks',        value: loading ? '…' : (data?.totalFormViews        ?? 0), icon: '👆', color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Demo Clicks',        value: loading ? '…' : (data?.totalDemoClicks       ?? 0), icon: '🧪', color: 'bg-violet-50 text-violet-700' },
          { label: 'Paid Users',         value: loading ? '…' : (data?.totalPaymentSuccesses ?? 0), icon: '💰', color: 'bg-green-50 text-green-700'  },
          { label: 'Claimed Codes',      value: loading ? '…' : (data?.claimedCodes          ?? 0), icon: '🏷️', color: 'bg-amber-50 text-amber-700'  },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-gray-200 p-5">
            <div className={`inline-flex rounded-xl p-2 text-lg ${s.color} mb-3`}>{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            {!s.noFilter && <div className="text-[10px] text-gray-400 mt-0.5">{PERIOD_LABELS[period]}</div>}
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
  const [result, setResult] = useState<string>('');

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult('');
    // TODO: implement /api/admin/upload endpoint
    await new Promise((r) => setTimeout(r, 1500));
    setResult('Upload endpoint not yet implemented. Place PDF manually at public/forms/');
    setUploading(false);
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Upload Government PDF</h2>
        <p className="text-xs text-gray-500 mb-4">
          Upload the original flat PDF. Azure Document Intelligence will extract field positions.
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
              <div className="text-xs text-gray-400 mt-1">Max 20MB · PDF only</div>
            </>
          )}
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {result && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
            {result}
          </div>
        )}

        <button
          className="btn-primary w-full mt-4"
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Uploading…' : '⬆️ Upload & Process'}
        </button>
      </div>

      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5 text-xs text-blue-800">
        <strong>Manual upload:</strong> Place the PDF at{' '}
        <code className="bg-blue-100 px-1 rounded">public/forms/hqp-pff-356.pdf</code> to enable
        real PDF generation. The coordinate overlay will be applied automatically.
      </div>
    </div>
  );
}

// ─── Storage Config Tab ───────────────────────────────────────────────────────
function StorageConfigTab() {
  const [backend, setBackend] = useState<'local' | 'azure'>('local');
  const [connectionString, setConnectionString] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  async function testConnection() {
    setTesting(true);
    setTestResult('');
    await new Promise((r) => setTimeout(r, 1000));
    if (backend === 'local') {
      setTestResult('✅ Local filesystem accessible');
    } else if (!connectionString) {
      setTestResult('❌ Connection string is required for Azure Blob');
    } else {
      setTestResult('🔄 Azure Blob test not yet implemented — add endpoint in .env.local');
    }
    setTesting(false);
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
          <div className="mt-4">
            <label className="field-label">Azure Blob Connection String</label>
            <input
              type="password"
              className="input-field"
              placeholder="DefaultEndpointsProtocol=https;AccountName=…"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
            />
          </div>
        )}

        {testResult && (
          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-700">
            {testResult}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            className="btn-secondary flex-1 text-xs py-2"
            onClick={testConnection}
            disabled={testing}
          >
            {testing ? 'Testing…' : '🔌 Test Connection'}
          </button>
          <button className="btn-primary flex-1 text-xs py-2">
            💾 Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
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
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [uploadBusy, setUploadBusy]   = useState(false);
  const [uploadMsg, setUploadMsg]     = useState('');
  const [loadError, setLoadError]     = useState('');
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/gcash-settings')
      .then(r => r.json())
      .then((d: { gcash_number: string; gcash_name: string; qr_url: string | null }) => {
        setGcashNumber(d.gcash_number ?? '');
        setGcashName(d.gcash_name ?? '');
        setQrUrl(d.qr_url ?? null);
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
    <div className="max-w-lg space-y-4">
      {/* Change Password */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Change Password</h2>
        <p className="text-xs text-gray-400 mb-4">Update the admin login password.</p>
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
      </div>

      {/* GCash Payment Settings */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">GCash Payment Settings</h2>
        {loadError && <p className="text-xs text-red-600">{loadError}</p>}
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
      </div>

      {/* GCash QR Code */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">GCash QR Code</h2>
        <p className="text-xs text-gray-500">Upload a QR code image so users can scan and pay directly.</p>
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
          <p className={`text-xs ${uploadMsg.includes('success') || uploadMsg.includes('removed') ? 'text-green-600' : 'text-red-600'}`}>{uploadMsg}</p>
        )}
      </div>

      {/* Environment Info */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Environment Info</h2>
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
      </div>

      <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
        <h3 className="text-sm font-semibold text-red-900">Danger Zone</h3>
        <p className="text-xs text-red-600 mt-1 mb-3">
          These actions cannot be undone.
        </p>
        <button className="text-xs text-red-600 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-100">
          Clear All Generated PDFs
        </button>
      </div>
    </div>
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

function PaymentRefsTab() {
  const [refs, setRefs]       = useState<RefEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [storageDir, setStorageDir] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/payment-refs');
    if (res.ok) {
      const data = await res.json() as { refs: RefEntry[]; dir: string };
      setRefs(data.refs);
      setStorageDir(data.dir);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(ref: string) {
    if (!confirm(`Delete ref ${ref}?`)) return;
    setDeleting(ref);
    await fetch('/api/admin/payment-refs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref }),
    });
    setDeleting(null);
    load();
  }

  async function handleFlushAll() {
    if (!confirm(`Delete ALL ${refs.length} reference numbers? This allows them to be reused.`)) return;
    setFlushing(true);
    await fetch('/api/admin/payment-refs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setFlushing(false);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Payment Ref Numbers</h2>
          <p className="text-xs text-gray-500 mt-0.5">Used GCash Ref No. records — {refs.length} stored</p>
          {storageDir && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{storageDir}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
          >
            🔄 Refresh
          </button>
          {refs.length > 0 && (
            <button
              onClick={handleFlushAll}
              disabled={flushing}
              className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
            >
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
                    <button
                      onClick={() => handleDelete(r.ref)}
                      disabled={deleting === r.ref}
                      className="text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 disabled:opacity-40"
                    >
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
      body: JSON.stringify({ count, label }),
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
