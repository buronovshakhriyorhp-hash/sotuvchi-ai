import React from 'react';
import { Palette, Check } from 'lucide-react';
import useTheme, { ThemeType } from '../store/useTheme';

const themes: { id: ThemeType; name: string; color: string }[] = [
  { id: 'default', name: 'Amber', color: '#fbbf24' },
  { id: 'theme-blue', name: 'Ocean Blue', color: '#3b82f6' },
  { id: 'theme-green', name: 'Forest Green', color: '#10b981' },
  { id: 'theme-dark', name: 'Deep Night', color: '#1e293b' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" style={{ position: 'relative' }} ref={menuRef}>
      <button 
        className="navbar-icon-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Mavzuni almashtirish"
      >
        <Palette size={20} />
      </button>

      {isOpen && (
        <div 
          className="glass-panel" 
          style={{ 
            position: 'absolute', 
            top: '100%', 
            right: 0, 
            marginTop: '0.5rem', 
            padding: '0.75rem', 
            width: '180px',
            zIndex: 1000,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', paddingLeft: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mavzuni tanlang
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: theme === t.id ? 'var(--primary-light)' : 'transparent',
                  color: theme === t.id ? 'var(--primary-dark)' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: theme === t.id ? 700 : 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (theme !== t.id) e.currentTarget.style.background = 'var(--surface-2)';
                }}
                onMouseLeave={(e) => {
                  if (theme !== t.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color }}></div>
                  <span>{t.name}</span>
                </div>
                {theme === t.id && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
