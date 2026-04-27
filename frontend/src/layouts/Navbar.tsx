import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, User, Settings, Search, Moon, Sun, Wallet } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import GlobalSearch from '../components/GlobalSearch';
import NotificationCenter from '../components/NotificationCenter';
import useAuth from '../store/useAuth';
import useTheme from '../store/useTheme';
import useCurrency from '../store/useCurrency';
import useSettings from '../store/useSettings';
import api from '../api/axios';

const UNREAD_COUNT = 3; 

interface NavbarProps {
  toggleSidebar: () => void;
  isCollapsed: boolean;
}

export default function Navbar({ toggleSidebar, isCollapsed }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { currency, setCurrency, format } = useCurrency();
  const { language, setLanguage, activeWarehouseId, setActiveWarehouseId, warehouses, fetchWarehouses } = useSettings();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch balance (Smart Polling)
  useEffect(() => {
    const fetchBalance = async () => {
      // Don't fetch if tab is hidden to save server resources
      if (document.visibilityState !== 'visible') return;

      try {
        const res = await api.get('/reports/balance');
        // The API returns { data: { balance: N } } due to sendSuccess utility
        const balanceData = res.data?.balance ?? res.balance ?? 0;
        setBalance(balanceData);
      } catch (err) { 
        console.error('Balance fetch error:', err); 
      }
    };

    // Initial fetch
    fetchBalance();
    fetchWarehouses();

    // Set interval to 3 minutes (180,000 ms)
    const intervalTime = 3 * 60 * 1000;
    const timer = setInterval(fetchBalance, intervalTime);

    // Listen for tab focus/visibility changes to update immediately when user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBalance();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="navbar">
        {/* Left */}
        <div className="navbar-left">
          <button className="navbar-icon-btn mobile-only" onClick={toggleSidebar} title="Menyu">
            <Menu size={20} />
          </button>
          
          <div className="navbar-divider mobile-only" />

          {/* Search */}
          <button
            className="navbar-icon-btn nav-desktop"
            onClick={() => setSearchOpen(true)}
            title="Qidiruv (Ctrl+K)"
            style={{ display:'flex', alignItems:'center', gap:'0.75rem', width:'auto', padding:'0 1rem', fontSize:'0.875rem', color:'var(--text-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'var(--surface-2)', minWidth:'240px', justifyContent:'flex-start', height:'42px', transition: 'all 0.2s' }}
          >
            <Search size={16} className="text-muted" /> 
            <span style={{ color: 'var(--text-muted)' }}>Tezkor qidiruv...</span>
            <kbd style={{ marginLeft:'auto', fontSize:'0.7rem', padding:'0.15rem 0.4rem', background:'var(--border-strong)', borderRadius:'4px', color:'var(--text-secondary)', fontWeight: 600 }}>/ K</kbd>
          </button>
        </div>

        {/* Right */}
        <div className="navbar-right">
          {/* Balance */}
          <div className="navbar-balance" style={{ 
            background: 'var(--primary-light)', 
            border: '1px solid var(--primary)', 
            color: 'var(--primary-dark)', 
            padding: window.innerWidth < 480 ? '0.35rem 0.6rem' : '0.5rem 1rem', 
            borderRadius: 'var(--radius)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            boxShadow: 'var(--shadow-sm)',
            fontSize: window.innerWidth < 480 ? '0.75rem' : '0.8125rem'
          }}>
            <Wallet size={window.innerWidth < 480 ? 14 : 16} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span className="nav-desktop" style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Balans</span>
              <span style={{ fontWeight: 800, fontSize: window.innerWidth < 480 ? '0.8rem' : '0.9rem' }}>{format(balance)}</span>
            </div>
          </div>

          <div className="navbar-divider nav-desktop" />

          {/* System Settings Dropdown */}
          <ThemeToggle />
          <div style={{ position:'relative' }} ref={settingsRef}>
            <button className="navbar-icon-btn" onClick={() => setSettingsOpen(v => !v)} title="Tizim sozlamalari">
              <Settings size={18} style={{ transform: settingsOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.4s var(--ease)' }} />
            </button>
            {settingsOpen && (
              <div className="dropdown-menu" style={{ minWidth:'240px', padding: '0.5rem' }}>
                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tizim sozlamalari</div>
                
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Ombor</label>
                    <select 
                      className="navbar-select" 
                      style={{ width: '100%', height: '36px' }}
                      value={activeWarehouseId || ''}
                      onChange={e => setActiveWarehouseId(e.target.value)}
                    >
                      {warehouses.length === 0 ? (
                        <option value="">Omborlar yuklanmoqda...</option>
                      ) : (
                        warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Til</label>
                    <select className="navbar-select" value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '100%', height: '36px' }}>
                      <option value="uz">O'zbekcha</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Valyuta</label>
                    <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', padding: '2px' }}>
                      <button
                        onClick={() => setCurrency('uzs')}
                        style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: 'calc(var(--radius) - 4px)', background: currency === 'uzs' ? 'var(--primary)' : 'transparent', color: currency === 'uzs' ? 'var(--primary-deep)' : 'var(--text-muted)', transition: 'all 0.2s' }}
                      >UZS</button>
                      <button
                        onClick={() => setCurrency('usd')}
                        style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: 'calc(var(--radius) - 4px)', background: currency === 'usd' ? 'var(--success)' : 'transparent', color: currency === 'usd' ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}
                      >USD</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="navbar-divider" />

          {/* Notifications */}
          <div style={{ position:'relative' }} ref={notifRef}>
            <button className="navbar-icon-btn" onClick={() => setNotifOpen(v=>!v)} title="Bildirishnomalar">
              <Bell size={18} />
              {UNREAD_COUNT > 0 && (
                <span style={{ position:'absolute', top:4, right:4, width:16, height:16, background:'var(--danger)', borderRadius:'50%', border:'2px solid var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:800, color:'#fff' }}>{UNREAD_COUNT}</span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 8px)', right: window.innerWidth < 768 ? -40 : 0, zIndex:100 }}>
                <NotificationCenter onClose={() => setNotifOpen(false)} />
              </div>
            )}
          </div>

          <div className="navbar-divider" />

          {/* Profile */}
          <div style={{ position:'relative' }} ref={profileRef}>
            <button className="navbar-profile" onClick={() => setProfileOpen(v => !v)} style={{ padding: window.innerWidth < 480 ? '0.25rem' : '0.375rem 0.75rem' }}>
              <div className="navbar-avatar" style={{ width: 28, height: 28 }}>{user?.name ? user.name[0] : 'U'}</div>
              <ChevronDown className="nav-desktop" size={14} style={{ color:'var(--text-muted)', transition:'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {profileOpen && (
              <div className="dropdown-menu" style={{ minWidth:'200px' }}>
                <div style={{ padding:'0.75rem 1rem', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.8125rem', fontWeight:600 }}>{user?.role === 'ADMIN' ? 'Admin' : 'Foydalanuvchi'}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.1rem' }}>{user?.phone}</div>
                </div>
                <button className="dropdown-item" onClick={() => navigate('/settings')}><User size={15}/> Profil</button>
                <div className="dropdown-divider"/>
                <button className="dropdown-item danger" onClick={handleLogout}><LogOut size={15}/> Chiqish</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
