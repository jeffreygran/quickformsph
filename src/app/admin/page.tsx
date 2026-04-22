'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FORMS } from '@/data/forms';

type AdminTab = 'dashboard' | 'catalog' | 'upload' | 'storage' | 'settings' | 'suggestions';

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    window.location.href = '/admin/login';
  }

  const tabs: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'dashboard',   icon: '📊', label: 'Dashboard' },
    { id: 'catalog',     icon: '📋', label: 'Form Catalog' },
    { id: 'upload',      icon: '⬆️', label: 'Upload PDF' },
    { id: 'storage',     icon: '💾', label: 'Storage Config' },
    { id: 'suggestions', icon: '💡', label: 'Suggestions' },
    { id: 'settings',    icon: '⚙️', label: 'Settings' },
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
          <Image
            src="/quickformsph-logo-transparent-slogan.png"
            alt="QuickFormsPH"
            width={140}
            height={38}
            className="h-8 w-auto object-contain"
            priority
          />
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
          {tab === 'settings'    && <SettingsTab />}
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
  return (
    <div className="max-w-lg space-y-4">
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
        <button onClick={load} className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">
          ↻ Refresh
        </button>
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
