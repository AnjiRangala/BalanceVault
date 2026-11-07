import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { ApiError, getBackendStatus } from './lib/api.js';

function navigate(path, replace = false) {
  if (window.location.pathname !== path) {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  return pathname;
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const shapes = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    cards: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18M7 15h3" /></>,
    activity: <><path d="M3 12h4l2.3-6 4.4 12 2.3-6H21" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.3 8.2-8 10-4.7-1.8-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    eye: <><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c6.2 0 9.5 7 9.5 7a15 15 0 0 1-2.6 3.4M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.3 7 9.5 7c1.2 0 2.2-.2 3.1-.6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    building: <><path d="M4 21V5l8-3 8 3v16M2 21h20M8 8h1m6 0h1M8 12h1m6 0h1M10 21v-5h4v5" /></>,
  };
  return <svg {...common}>{shapes[name] ?? shapes.grid}</svg>;
}

function Brand({ inverse = false }) {
  return (
    <a href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('/dashboard'); }} className={`brand ${inverse ? 'brand-inverse' : ''}`} aria-label="BalanceVault dashboard">
      <span className="brand-mark">b<span>.</span></span>
      <span className="brand-word">balancevault</span>
    </a>
  );
}

function PasswordField({ label = 'Password', value, onChange, autoComplete = 'current-password', hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field-label">
      <span>{label}</span>
      <span className="password-input-wrap">
        <input
          required
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={autoComplete === 'new-password' ? 12 : 1}
          maxLength={72}
          placeholder={autoComplete === 'new-password' ? 'At least 12 characters' : 'Enter your password'}
        />
        <button className="password-toggle" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>
          <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </span>
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (isRegister && password.length < 12) {
      setError('Use a password with at least 12 characters.');
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) await register({ name, email, password });
      else await login({ email, password });
      setPassword('');
      navigate('/dashboard', true);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not sign you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="BalanceVault introduction">
        <div className="auth-story-top"><Brand inverse /><span className="story-status"><i /> Secure ledger platform</span></div>
        <div className="story-copy">
          <p className="eyebrow">Money, accounted for.</p>
          <h1>Confidence in every<br /><em>transaction.</em></h1>
          <p className="story-description">A clearer view of your accounts, built on a ledger where every entry has its place.</p>
        </div>
        <div className="ledger-art" aria-hidden="true">
          <div className="ledger-orbit orbit-one" /><div className="ledger-orbit orbit-two" />
          <div className="ledger-card"><div className="ledger-card-top"><span>BV / PRIVATE LEDGER</span><span className="ledger-dot" /></div><div className="ledger-lines"><i /><i /><i /></div><div className="ledger-card-foot"><span>SECURE BY DESIGN</span><Icon name="shield" size={20} /></div></div>
          <div className="ledger-chip chip-top">01 <span>Verified access</span></div>
          <div className="ledger-chip chip-bottom"><span className="chip-check">✓</span> Every entry accountable</div>
        </div>
        <div className="story-footer"><span>Private by design</span><span>Built around financial integrity</span></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand"><Brand /></div>
        <div className="auth-form-card">
          <div className="form-heading">
            <span className="form-kicker">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</span>
            <h2>{isRegister ? 'Create your account' : 'Sign in to your vault'}</h2>
            <p>{isRegister ? 'Set up your secure account in a few steps.' : 'Your accounts, clearly in view.'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && <label className="field-label"><span>Full name</span><input required type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} placeholder="Your name" /></label>}
            <label className="field-label"><span>Email address</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} placeholder="you@example.com" /></label>
            <PasswordField value={password} onChange={setPassword} autoComplete={isRegister ? 'new-password' : 'current-password'} hint={isRegister ? 'Use 12 or more characters.' : null} />
            {error && <div className="form-error" role="alert"><span>!</span>{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? <><span className="spinner" />{isRegister ? 'Creating account…' : 'Signing in…'}</> : <>{isRegister ? 'Create account' : 'Sign in'}<Icon name="arrow" size={18} /></>}
            </button>
          </form>

          <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to BalanceVault?'} <button type="button" onClick={() => navigate(isRegister ? '/login' : '/register')}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
          <div className="secure-note"><Icon name="lock" size={15} /><span>Your connection is protected. We never display or store your password in the browser after signing in.</span></div>
        </div>
        <p className="auth-legal">BalanceVault · Secure financial ledger</p>
      </section>
    </main>
  );
}

function BackendBadge() {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    const controller = new AbortController();
    getBackendStatus(controller.signal).then((available) => setStatus(available ? 'online' : 'offline')).catch(() => {});
    const interval = window.setInterval(() => {
      getBackendStatus(controller.signal).then((available) => setStatus(available ? 'online' : 'offline')).catch(() => {});
    }, 30_000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, []);
  const label = { checking: 'Checking system', online: 'Systems operational', offline: 'Connection unavailable' }[status];
  return <div className={`backend-badge backend-${status}`} title="Database readiness status"><i />{label}</div>;
}

const roleLabels = { ADMIN: 'Administrator', ACCOUNT_HOLDER: 'Account holder', AUDITOR: 'Auditor' };

function AppShell({ pathname }) {
  const { user, logout, request } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: 'grid' },
    { path: '/accounts', label: 'Accounts', icon: 'cards' },
    ...(isAdmin ? [{ path: '/audit', label: 'Audit log', icon: 'shield' }] : []),
  ];

  function signOut() {
    logout();
    navigate('/login', true);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand inverse /><button className="mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation">×</button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => <a key={item.path} href={item.path} aria-current={pathname === item.path ? 'page' : undefined} className={`nav-link ${pathname === item.path ? 'nav-active' : ''}`} onClick={(event) => { event.preventDefault(); navigate(item.path); }}><Icon name={item.icon} /><span>{item.label}</span>{item.path === '/accounts' && <span className="nav-chevron">›</span>}</a>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-security"><span className="security-icon"><Icon name="shield" size={17} /></span><div><strong>Protected ledger</strong><small>Secure by design</small></div><span className="security-check">✓</span></div><div className="sidebar-version">BALANCEVAULT <span>·</span> PRIVATE</div></div>
      </aside>
      {mobileMenuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-leading"><button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><span /><span /><span /></button><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{pathname === '/accounts' ? 'Accounts' : pathname === '/audit' ? 'Audit log' : 'Overview'}</strong></div></div>
          <div className="topbar-actions"><BackendBadge /><span className="topbar-divider" /><div className="profile-summary"><span className="avatar">{user.email[0]?.toUpperCase()}</span><span className="profile-email">{user.email}</span></div><button className="icon-button signout-button" onClick={signOut} title="Sign out" aria-label="Sign out"><Icon name="logout" size={18} /></button></div>
        </header>
        <main className="page-content">
          {pathname === '/accounts' ? <AccountsPage request={request} /> : pathname === '/audit' && isAdmin ? <AuditPage request={request} /> : <DashboardPage request={request} user={user} />}
        </main>
        <footer className="app-footer"><span>BalanceVault <i>·</i> Financial clarity, by design.</span><span className="footer-secure"><Icon name="lock" size={13} /> Secure session</span></footer>
      </div>
    </div>
  );
}

function DashboardPage({ request, user }) {
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    request('/api/accounts', { signal: controller.signal })
      .then((result) => setAccounts(result.accounts ?? []))
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message); });
    return () => controller.abort();
  }, [request]);
  const firstName = user.email.split('@')[0];
  const activeCount = accounts?.filter((account) => account.status === 'ACTIVE').length ?? 0;

  return (
    <>
      <section className="welcome-panel">
        <div className="welcome-copy"><div className="welcome-date"><span className="welcome-spark">✳</span> YOUR FINANCIAL OVERVIEW</div><h1>Good to see you, <em>{firstName}</em></h1><p>Everything in its place. Here’s your account overview.</p><div className="welcome-role"><span className="role-dot" />{roleLabels[user.role] ?? 'Member'} <span className="welcome-separator">·</span> Private workspace</div></div>
        <div className="welcome-art" aria-hidden="true"><span className="art-ring ring-a" /><span className="art-ring ring-b" /><span className="art-coin">b<span>.</span></span><span className="art-orbit-dot" /></div>
        <div className="welcome-index">01 <span>/</span> 03</div>
      </section>

      <section className="section-block account-overview-block">
        <div className="section-heading"><div><span className="section-kicker">YOUR SPACE</span><h2>Account overview</h2></div><button className="text-link" onClick={() => navigate('/accounts')}>All accounts <Icon name="arrow" size={16} /></button></div>
        <div className="summary-grid">
          <div className="summary-card account-count-card"><span className="summary-icon"><Icon name="cards" size={19} /></span><span className="summary-label">Total accounts</span><strong>{accounts === null ? '—' : accounts.length.toString().padStart(2, '0')}</strong><small>{accounts === null ? 'Loading account data' : accounts.length === 1 ? 'Account connected' : 'Accounts connected'}</small><div className="summary-decoration" aria-hidden="true" /></div>
          <div className="summary-card"><span className="summary-icon summary-icon-light"><Icon name="shield" size={19} /></span><span className="summary-label">Account status</span><strong className="summary-status">{accounts === null ? '—' : accounts.length === 0 ? 'No accounts' : 'In good order'}</strong><small>{accounts === null ? 'Checking your accounts' : `${activeCount} active ${activeCount === 1 ? 'account' : 'accounts'}`}</small><span className="summary-status-line"><i /></span></div>
        </div>
        {error && <div className="inline-error" role="alert"><span>We couldn’t load your accounts.</span><small>{error}</small><button onClick={() => window.location.reload()}>Try again</button></div>}
      </section>

      <div className="dashboard-lower-grid">
        <section className="section-block account-list-block">
          <div className="section-heading compact-heading"><div><span className="section-kicker">CONNECTED</span><h2>Your accounts</h2></div><button className="square-link" onClick={() => navigate('/accounts')} aria-label="View all accounts"><Icon name="arrow" size={17} /></button></div>
          {accounts === null ? <div className="loading-row"><span className="spinner spinner-dark" />Loading accounts</div> : accounts.length === 0 ? <EmptyState title="No accounts yet" detail="Accounts you can access will appear here." /> : <div className="account-list">{accounts.slice(0, 4).map((account) => <AccountRow key={account.id} account={account} />)}</div>}
          {accounts?.length > 4 && <button className="view-all-link" onClick={() => navigate('/accounts')}>View all {accounts.length} accounts <Icon name="arrow" size={15} /></button>}
        </section>

        <section className="section-block quick-actions-block">
          <div className="section-heading compact-heading"><div><span className="section-kicker">ON YOUR TERMS</span><h2>Quick actions</h2></div></div>
          <div className="quick-actions">
            <ActionCard title="Deposit" label="Add funds" tone="sage" />
            <ActionCard title="Withdraw" label="Move funds out" tone="cream" />
            <ActionCard title="Transfer" label="Between accounts" tone="lavender" />
          </div>
          <p className="coming-note"><span />Money movement will be available here soon.</p>
        </section>
      </div>

      <section className="section-block activity-block">
        <div className="section-heading"><div><span className="section-kicker">LEDGER</span><h2>Recent activity</h2></div><div className="activity-filter"><span className="filter-indicator" />All activity <span className="filter-caret">⌄</span></div></div>
        <EmptyState title="Your activity will show here" detail="There are no transactions to display yet. When activity is available, it will appear here from your account ledger." icon="activity" />
      </section>
    </>
  );
}

function AccountsPage({ request }) {
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    request('/api/accounts', { signal: controller.signal })
      .then((result) => setAccounts(result.accounts ?? []))
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message); });
    return () => controller.abort();
  }, [request]);
  return <section className="section-block full-page-block"><div className="page-title-row"><div><span className="section-kicker">YOUR SPACE</span><h1>Accounts</h1><p>Accounts available to your BalanceVault profile.</p></div>{accounts && <span className="count-pill">{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</span>}</div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {accounts === null && !error ? <div className="loading-row"><span className="spinner spinner-dark" />Loading accounts</div> : accounts?.length === 0 ? <EmptyState title="No accounts available" detail="Accounts you are permitted to view will appear here." /> : <div className="accounts-grid">{accounts?.map((account) => <AccountCard key={account.id} account={account} />)}</div>}
  </section>;
}

function AuditPage({ request }) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    request('/api/audit?page=1&perPage=25', { signal: controller.signal })
      .then((result) => setEvents(result.events ?? []))
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message); });
    return () => controller.abort();
  }, [request]);
  return <section className="section-block full-page-block"><div className="page-title-row"><div><span className="section-kicker">ADMINISTRATION</span><h1>Audit log</h1><p>Recent recorded actions across BalanceVault.</p></div></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {events === null && !error ? <div className="loading-row"><span className="spinner spinner-dark" />Loading audit events</div> : events?.length === 0 ? <EmptyState title="No audit events yet" detail="Recorded actions will appear here." /> : <div className="audit-list">{events?.map((event) => <article className="audit-row" key={event.id}><span className="audit-icon"><Icon name="activity" size={18} /></span><div className="audit-main"><strong>{event.action.replaceAll('_', ' ').toLowerCase()}</strong><span>{event.actor.email} · {event.entityType}</span></div><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time></article>)}</div>}
  </section>;
}

function AccountRow({ account }) {
  return <article className="account-row"><span className="account-symbol"><Icon name={account.type === 'BUSINESS' ? 'building' : 'cards'} size={18} /></span><span className="account-row-main"><strong>{account.accountNumber}</strong><small>{account.type === 'BUSINESS' ? 'Business account' : 'Personal account'}</small></span><span className={`status-pill status-${account.status.toLowerCase()}`}><i />{account.status.toLowerCase()}</span><span className="account-currency">{account.currencyCode}</span></article>;
}

function AccountCard({ account }) {
  return <article className="account-card"><div className="account-card-top"><span className="account-symbol account-symbol-large"><Icon name={account.type === 'BUSINESS' ? 'building' : 'cards'} size={20} /></span><span className={`status-pill status-${account.status.toLowerCase()}`}><i />{account.status.toLowerCase()}</span></div><div className="account-card-info"><span>{account.type === 'BUSINESS' ? 'BUSINESS ACCOUNT' : 'PERSONAL ACCOUNT'}</span><h3>{account.accountNumber}</h3></div><div className="account-card-bottom"><span>Currency</span><strong>{account.currencyCode}</strong></div></article>;
}

function ActionCard({ title, label, tone }) {
  return <button className={`action-card action-${tone}`} type="button" disabled aria-label={`${title}, coming soon`}><span className="action-icon"><Icon name="plus" size={19} /></span><span className="action-title">{title}</span><span className="action-label">{label}</span><span className="action-soon">SOON</span></button>;
}

function EmptyState({ title, detail, icon = 'cards' }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={20} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function AppRouter() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const publicRoute = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!isAuthenticated && !publicRoute) navigate('/login', true);
    else if (isAuthenticated && publicRoute) navigate('/dashboard', true);
    else if (!['/login', '/register', '/dashboard', '/accounts', '/audit'].includes(pathname)) {
      navigate(isAuthenticated ? '/dashboard' : '/login', true);
    } else if (pathname === '/audit' && user?.role !== 'ADMIN') navigate('/dashboard', true);
  }, [isAuthenticated, pathname, publicRoute, user?.role]);

  if (!isAuthenticated) return <AuthPage key={pathname === '/register' ? 'register' : 'login'} mode={pathname === '/register' ? 'register' : 'login'} />;
  return <AppShell pathname={pathname} />;
}

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>;
}
