import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@/store/useAuth';

const SA = '/gumsmass_645_super_admin_panel';

const NAV = [
  {
    path: SA,
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" rx="2" width="7" height="7"/><rect x="14" y="3" rx="2" width="7" height="7"/>
        <rect x="3" y="14" rx="2" width="7" height="7"/><rect x="14" y="14" rx="2" width="7" height="7"/>
      </svg>
    ),
    label: 'Dashboard',
  },
  {
    path: `${SA}/all`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    label: 'Bizneslar',
  },
  {
    path: `${SA}/pending`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: 'Kutilayotgan',
    badge: true,
  },
  {
    path: `${SA}/payments`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" rx="2" width="22" height="16"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    label: "To'lovlar",
  },
  {
    path: `${SA}/settings`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
    label: 'Sozlamalar',
  },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.root}>
      {/* ─── Sidebar ─── */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>N</div>
          <div>
            <div style={styles.logoTitle}>Nexus ERP</div>
            <div style={styles.logoBadge}>SuperAdmin</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          <div style={styles.navLabel}>BOSHQARUV</div>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                ...styles.navItem,
                background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
                borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
              })}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div style={styles.userArea}>
          <div style={styles.userAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>Platform Owner</div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Chiqish">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <div style={styles.breadcrumb}>
            <span style={styles.breadcrumbText}>
              {location.pathname === SA ? 'Dashboard' :
               location.pathname.endsWith('/all') ? 'Barcha Bizneslar' :
               location.pathname.endsWith('/pending') ? 'Kutilayotganlar' :
               location.pathname.endsWith('/payments') ? "To'lovlar" :
               location.pathname.endsWith('/settings') ? 'Sozlamalar' : ''}
            </span>
          </div>
          <div style={styles.topbarRight}>
            <div style={styles.onlineDot} />
            <span style={styles.onlineText}>Tizim onlayn</span>
          </div>
        </header>

        {/* Content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#0f172a',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  sidebar: {
    width: '240px',
    flexShrink: 0,
    background: '#0f172a',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'relative',
    zIndex: 10,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
  },
  logoBadge: {
    fontSize: '0.62rem',
    fontWeight: 700,
    color: '#7c3aed',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navLabel: {
    fontSize: '0.62rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.1em',
    padding: '0 8px 8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s',
    cursor: 'pointer',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '0.68rem',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.4)',
    borderRadius: '6px',
    padding: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#f8fafc',
  },
  topbar: {
    height: '56px',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    flexShrink: 0,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  breadcrumbText: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 0 2px rgba(16,185,129,0.2)',
  },
  onlineText: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#10b981',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px',
  },
};
