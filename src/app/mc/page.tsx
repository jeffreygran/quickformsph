'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FORMS } from '@/data/forms';

type AdminTab = 'dashboard' | 'catalog' | 'upload' | 'storage' | 'settings' | 'suggestions' | 'refs' | 'pdfs' | 'security';

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
    { id: 'pdfs',        icon: '📄', label: 'Generated PDFs' },
    { id: 'settings',    icon: '⚙️', label: 'Settings' },
    { id: 'security',    icon: '🛡️', label: 'Security' },
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
          {tab === 'pdfs'        && <GeneratedPDFsTab />}
          {tab === 'settings'    && <SettingsTab />}
          {tab === 'security'    && <SecurityTab />}
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab() {
  const stats = [
    { label: 'Total Forms', value: FORMS.length, icon: '📋', color: 'bg-blue-50 text-blue-700' },
    { label: 'PDFs Generated', value: '—', icon: '📄', color: 'bg-green-50 text-green-700' },
    { label: 'Storage Backend', value: 'Local FS', icon: '💾', color: 'bg-amber-50 text-amber-700' },
    { label: 'Last Upload', value: '—', icon: '⬆️', color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-gray-200 p-5">
            <div className={`inline-flex rounded-xl p-2 text-lg ${s.color} mb-3`}>{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary text-xs px-4 py-2">⬆️ Upload New PDF</button>
          <button className="btn-secondary text-xs px-4 py-2">📋 View Form Catalog</button>
          <button className="btn-secondary text-xs px-4 py-2">⚙️ Configure Storage</button>
        </div>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
        <div className="font-medium text-amber-900 text-sm">⚠️ Dev Environment Notice</div>
        <p className="text-xs text-amber-700 mt-1">
          This is the local development instance. Production is at{' '}
          <code className="bg-amber-100 px-1 rounded">quickformsph.jeffreygran.ph</code>.
          PDF generation uses placeholder coordinates — calibrate after uploading the real PDF.
        </p>
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
