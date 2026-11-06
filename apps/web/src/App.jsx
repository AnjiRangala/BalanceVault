import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiBaseUrl}/api/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable');
        return response.json();
      })
      .then((result) => setApiStatus(result.status === 'healthy' ? 'connected' : 'unavailable'))
      .catch((error) => {
        if (error.name !== 'AbortError') setApiStatus('unavailable');
      });

    return () => controller.abort();
  }, []);

  const statusLabel = {
    checking: 'Checking connection',
    connected: 'API connected',
    unavailable: 'API unavailable',
  }[apiStatus];

  return (
    <main className="min-h-screen px-5 py-8 sm:px-10 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <a className="flex items-center gap-3 font-semibold tracking-tight" href="/" aria-label="BalanceVault home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-lg text-white">B</span>
            <span className="text-slate-900">BalanceVault</span>
          </a>
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600">Secure ledger</span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-20">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">Clarity in every entry</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">BalanceVault</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">A secure financial ledger built to keep every balance accountable and every entry in its place.</p>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-900" aria-hidden="true">✓</span>
              <span>Designed around accuracy, access, and trust.</span>
            </div>
          </div>

          <aside className="rounded-3xl border border-white bg-white/80 p-7 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)] sm:p-9" aria-label="API connection status">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">System status</p>
              <span className={`h-2.5 w-2.5 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'unavailable' ? 'bg-rose-500' : 'animate-pulse bg-amber-400'}`} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{statusLabel}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Connection to the BalanceVault API health endpoint.</p>
            <div className="my-7 h-px bg-slate-100" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Environment</span>
              <span className="font-medium text-slate-700">Development</span>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-200/80 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>BalanceVault · Secure financial ledger</span>
          <span>Built for clarity and accountability</span>
        </footer>
      </div>
    </main>
  );
}
