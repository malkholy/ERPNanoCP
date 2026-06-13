import { useState, useEffect, useCallback } from "react";
import nav from "./nav.js";
import { apiCall } from "./shared/api.js";

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `


*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:           #f8fafc;
  --surface:      #ffffff;
  --soft:         #f9fafb;
  --text:         #111827;
  --muted:        #64748b;
  --border:       #e5e7eb;
  --primary:      #f97316;
  --primary-dark: #ea580c;
  --primary-soft: #ffedd5;
  --green:        #16a34a;
  --green-soft:   #dcfce7;
  --red:          #dc2626;
  --red-soft:     #fee2e2;
  --blue:         #2563eb;
  --blue-soft:    #dbeafe;
  --shadow:       0 16px 40px rgba(15,23,42,.08);
  font-family: Inter, 'Segoe UI', Arial, sans-serif;
}

body { background: var(--bg); color: var(--text); }

/* ── LOGIN ── */
.erp-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #111827, #1f2937);
  padding: 24px;
}
.erp-login-card {
  width: 100%;
  max-width: 430px;
  background: var(--surface);
  border-radius: 28px;
  padding: 34px;
  box-shadow: 0 30px 80px rgba(0,0,0,.35);
}
.erp-logo {
  width: 64px; height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  display: grid; place-items: center;
  font-weight: 900; font-size: 14px;
  margin: 0 auto 14px;
}
.erp-login-card h2 { text-align: center; font-size: 28px; margin-bottom: 6px; }
.erp-login-card p  { text-align: center; color: var(--muted); margin-bottom: 24px; }
.erp-input-group { margin-bottom: 16px; }
.erp-input-group label { display: block; font-weight: 800; margin-bottom: 7px; font-size: 13px; }
.erp-input-group input {
  width: 100%; height: 48px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--soft);
  padding: 0 14px;
  font-weight: 700;
  font-size: 14px;
  outline: none;
  transition: border-color .15s;
}
.erp-input-group input:focus { border-color: var(--primary); }
.erp-login-error { color: var(--red); font-size: 13px; margin-bottom: 12px; text-align: center; }
.erp-login-btn {
  width: 100%; height: 50px; border: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff; font-weight: 900; font-size: 16px;
  cursor: pointer;
  transition: opacity .15s;
}
.erp-login-btn:hover { opacity: .9; }
.erp-login-btn:disabled { opacity: .6; cursor: not-allowed; }

/* ── APP SHELL ── */
.erp-shell { display: flex; min-height: 100vh; }

/* ── SIDEBAR ── */
.erp-sidebar {
  width: 260px;
  background: #1f2937;
  color: #fff;
  position: fixed; left: 0; top: 0; bottom: 0;
  padding: 20px 16px;
  display: flex; flex-direction: column;
  z-index: 50;
  box-shadow: 12px 0 34px rgba(0,0,0,.12);
  transition: transform .25s;
}
.erp-side-brand {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 24px; padding: 0 4px;
}
.erp-side-logo {
  width: 46px; height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  display: grid; place-items: center;
  font-weight: 900; font-size: 11px; color: #fff;
  flex-shrink: 0;
}
.erp-side-brand h2 { font-size: 20px; line-height: 1.2; }
.erp-side-brand p  { font-size: 11px; color: #9ca3af; }

.erp-side-section {
  font-size: 10px; font-weight: 900;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .08em;
  padding: 14px 10px 6px;
}
.erp-side-menu { list-style: none; flex: 1; overflow-y: auto; }
.erp-side-link {
  display: flex; align-items: center; gap: 10px;
  color: #e5e7eb; text-decoration: none;
  padding: 11px 12px;
  border-radius: 14px;
  font-size: 14px; font-weight: 800;
  cursor: pointer;
  transition: background .15s;
  margin-bottom: 2px;
}
.erp-side-link:hover { background: #374151; }
.erp-side-link.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  box-shadow: 0 10px 24px rgba(249,115,22,.3);
  border-radius: 14px;
}
.erp-side-icon {
  width: 28px; height: 28px;
  border-radius: 9px;
  background: rgba(255,255,255,.09);
  display: grid; place-items: center;
  font-size: 14px; flex-shrink: 0;
}
.erp-side-link.active .erp-side-icon { background: rgba(255,255,255,.18); }

.erp-side-footer {
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 18px;
  padding: 14px;
  margin-top: 12px;
}
.erp-side-user { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.erp-side-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  display: grid; place-items: center;
  font-weight: 900; font-size: 12px;
  flex-shrink: 0;
}
.erp-side-user strong { display: block; font-size: 13px; }
.erp-side-user span  { display: block; color: #9ca3af; font-size: 11px; }
.erp-side-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.erp-side-actions button {
  height: 36px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.1);
  color: #f3f4f6; font-weight: 900; font-size: 13px;
  cursor: pointer;
  transition: background .15s;
}
.erp-side-actions button:hover { background: rgba(255,255,255,.2); }

/* ── MAIN ── */
.erp-main { margin-left: 260px; width: calc(100% - 260px); min-height: 100vh; display: flex; flex-direction: column; }

/* ── TOPBAR / TABS ── */
.erp-topbar {
  height: 56px;
  background: rgba(248,250,252,.92);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: flex-end;
  padding: 0 20px;
  position: sticky; top: 0; z-index: 30;
  gap: 4px;
}
.erp-mobile-toggle {
  display: none;
  height: 38px; border: 1px solid var(--border);
  background: var(--surface); border-radius: 11px;
  padding: 0 12px; font-weight: 900; cursor: pointer;
  margin-bottom: 8px; margin-right: 8px;
}
.erp-tabs { display: flex; gap: 6px; overflow-x: auto; align-items: flex-end; }
.erp-tabs::-webkit-scrollbar { display: none; }
.erp-tab {
  height: 36px;
  display: flex; align-items: center; gap: 6px;
  padding: 0 13px;
  border: 1px solid var(--border); border-bottom: 0;
  border-radius: 12px 12px 0 0;
  background: var(--soft);
  color: var(--muted);
  font-size: 13px; font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background .12s, color .12s;
}
.erp-tab:hover { background: #f1f5f9; color: var(--text); }
.erp-tab.active {
  background: var(--surface);
  color: var(--text);
  position: relative;
}
.erp-tab.active::before {
  content: '';
  position: absolute; left: 10px; right: 10px; top: 0;
  height: 3px; border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
}
.erp-tab-close {
  font-size: 14px; color: var(--muted);
  line-height: 1; margin-left: 2px;
  border-radius: 4px; padding: 1px 3px;
}
.erp-tab-close:hover { background: var(--primary-soft); color: var(--primary-dark); }

/* ── CONTENT ── */
.erp-content { flex: 1; padding: 24px; }

/* ── MOBILE OVERLAY ── */
.erp-mobile-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(15,23,42,.45); z-index: 40;
}
.erp-mobile-overlay.show { display: block; }

/* ── RESPONSIVE ── */
@media (max-width: 1050px) {
  .erp-sidebar { transform: translateX(-100%); }
  .erp-sidebar.open { transform: translateX(0); }
  .erp-main { margin-left: 0; width: 100%; }
  .erp-mobile-toggle { display: flex; align-items: center; }
}
@media (max-width: 520px) {
  .erp-sidebar { width: 86vw; max-width: 300px; }
  .erp-topbar { padding: 0 12px; }
  .erp-content { padding: 14px; }
}
`;

function injectCSS() {
  if (document.getElementById("erp-nano-css")) return;
  const s = document.createElement("style");
  s.id = "erp-nano-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── PLACEHOLDER PAGE ────────────────────────────────────────────────────────
function PlaceholderPage({ pageKey }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{pageKey}</div>
      <div style={{ fontSize: 13, marginTop: 6 }}>Page not built yet</div>
    </div>
  );
}

// ─── PAGE REGISTRY ───────────────────────────────────────────────────────────
// Import real pages here as they are built:
import UserList from "./pages/UserList.jsx";
import GroupMaster from "./pages/GroupMaster.jsx";
import GroupPages from "./pages/GroupPages.jsx";
import PageMaster from "./pages/PageMaster.jsx";
import UserPermissions from "./pages/UserPermissions.jsx";
import FilterMaster from "./pages/FilterMaster.jsx";
const PAGE_MAP = {
  userlist: UserList,
  groups: GroupMaster,
  pages: PageMaster,
  userpermissions: UserPermissions,
  grouppages: GroupPages,
  filters: FilterMaster,
};

function resolvePage(key) {
  return PAGE_MAP[key] || (() => <PlaceholderPage pageKey={key} />);
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiCall("CP Login", { Username: username, Password: password });
      if (data.State === 0 && data.List0?.[0]) {
        sessionStorage.setItem("UserName", data.List0[0].Name || ""); onLogin(data.List0[0]);
      } else {
        setError(data.Message || "Invalid credentials");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  }

  return (
    <div className="erp-login">
      <div className="erp-login-card">
        <div className="erp-logo">ERP</div>
        <h2>ERP Nano CP</h2>
        <p>Sign in to continue</p>
        {error && <div className="erp-login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="erp-input-group">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          </div>
          <div className="erp-input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="erp-login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ user, activeKey, onNavigate, onLogout, open, darkMode, onToggleDark }) {
  const initials = (user?.Name || user?.UserName || "??").slice(0, 2).toUpperCase();

  return (
    <aside className={`erp-sidebar ${open ? "open" : ""}`}>
      <div className="erp-side-brand">
        <div className="erp-side-logo">ERP</div>
        <div>
          <h2>ERP Nano</h2>
          <p>Control Panel</p>
        </div>
      </div>

      <ul className="erp-side-menu">
        {nav.map(group => (
          <li key={group.section}>
            <div className="erp-side-section">{group.section}</div>
            <ul style={{ listStyle: "none" }}>
              {group.items.map(item => (
                <li key={item.key}>
                  <div
                    className={`erp-side-link ${activeKey === item.key ? "active" : ""}`}
                    onClick={() => onNavigate(item)}
                  >
                    <span className="erp-side-icon">{item.icon}</span>
                    {item.label}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="erp-side-footer">
        <div className="erp-side-user">
          <div className="erp-side-avatar">{initials}</div>
          <div>
            <strong>{user?.Name || user?.UserName}</strong>
            <span>{user?.RoleName || "Admin"}</span>
          </div>
        </div>
        <div className="erp-side-actions">
          <button>Profile</button>
          <button onClick={onLogout}>Logout</button>
          <button onClick={onToggleDark} style={{gridColumn:"1/-1"}}>{darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}</button>
        </div>
      </div>
    </aside>
  );
}

// ─── SHELL ───────────────────────────────────────────────────────────────────
export default function ERPNanoCP() {
  injectCSS();

  const [user, setUser]       = useState(null);
  const [tabs, setTabs]       = useState([]);
  const [activeTab, setActive] = useState(null);
  const [sidebarOpen, setSidebar] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { document.body.classList.toggle("dark", darkMode); }, [darkMode]);

  // auto-logout after 8 hours
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => setUser(null), 8 * 60 * 60 * 1000);
    return () => clearTimeout(t);
  }, [user]);

  function openTab(item) {
    setSidebar(false);
    const existing = tabs.find(t => t.key === item.key);
    if (existing) {
      setActive(item.key);
      return;
    }
    const newTab = { key: item.key, label: item.label, icon: item.icon };
    setTabs(prev => [...prev, newTab]);
    setActive(item.key);
  }

  function closeTab(key, e) {
    e.stopPropagation();
    const idx = tabs.findIndex(t => t.key === key);
    const next = tabs.filter(t => t.key !== key);
    setTabs(next);
    if (activeTab === key) {
      setActive(next[Math.min(idx, next.length - 1)]?.key || null);
    }
  }

  function handleLogin(userData) {
    setUser(userData);
  }

  if (!user) return <Login onLogin={handleLogin} />;

  const ActivePage = activeTab ? resolvePage(activeTab) : null;

  return (
    <div className="erp-shell">
      <div className={`erp-mobile-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebar(false)} />

      <Sidebar
        user={user}
        activeKey={activeTab}
        onNavigate={openTab}
        onLogout={() => setUser(null)}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(v => !v)}
        open={sidebarOpen}
      />

      <main className="erp-main">
        <div className="erp-topbar">
          <button className="erp-mobile-toggle" onClick={() => setSidebar(v => !v)}>☰</button>
          <div className="erp-tabs">
            {tabs.map(tab => (
              <div
                key={tab.key}
                className={`erp-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActive(tab.key)}
              >
                {tab.icon} {tab.label}
                <span className="erp-tab-close" onClick={e => closeTab(tab.key, e)}>×</span>
              </div>
            ))}
          </div>
        </div>

        <div className="erp-content">
          {ActivePage
            ? <ActivePage user={user} />
            : (
              <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>▦</div>
                <div style={{ fontWeight: 900, fontSize: 20 }}>ERP Nano CP</div>
                <div style={{ fontSize: 14, marginTop: 6 }}>Select a page from the sidebar</div>
              </div>
            )
          }
        </div>
      </main>
    </div>
  );
}
