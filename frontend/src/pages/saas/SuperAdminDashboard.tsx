import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saasApi, SaasStats, Business } from '../../api/saas.api';

const SA = '/gumsmass_645_super_admin_panel';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SaasStats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [s, b] = await Promise.all([saasApi.getStats(), saasApi.getAllBusinesses()]);
      setStats(s);
      setBusinesses(b.slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={spinner} />
    </div>
  );

  const statCards = [
    { label: 'Barcha Bizneslar', value: stats?.totalBusinesses ?? 0, icon: '🏢', color: '#6366f1', bg: '#eef2ff', delta: '+2 bu oy' },
    { label: 'Faol Tenantlar',   value: stats?.activeBusinesses  ?? 0, icon: '✅', color: '#10b981', bg: '#ecfdf5', delta: 'Aktiv' },
    { label: 'Kutilayotgan',     value: stats?.pendingBusinesses ?? 0, icon: '⏳', color: '#f59e0b', bg: '#fffbeb', delta: 'Tasdiqlash kerak' },
    { label: "Jami Foydalanuvchilar", value: stats?.totalUsers ?? 0, icon: '👤', color: '#3b82f6', bg: '#eff6ff', delta: 'Barcha rollar' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={styles.pageTitle}>Platform Ko'rinishi</h1>
        <p style={styles.pageSubtitle}>Barcha tenantlar va tizim holati haqida umumiy ma'lumot</p>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        {statCards.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: s.color, fontWeight: 600, marginTop: '6px' }}>
                  {s.delta}
                </div>
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Businesses Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>So'nggi Bizneslar</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Oxirgi ro'yxatdan o'tganlar</div>
          </div>
          <button onClick={() => navigate(`${SA}/all`)} style={styles.viewAllBtn}>
            Barchasini ko'rish →
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              {['Biznes', 'Egasi telefoni', 'Holati', 'Trial', "Qo'shilgan sana"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Ma'lumot yo'q</td></tr>
            ) : businesses.map(b => {
              const trial = getTrialInfo(b.trialExpiresAt);
              return (
                <tr key={b.id} style={styles.tr} onClick={() => navigate(`${SA}/all`)}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ ...styles.bizAvatar, background: strToColor(b.name) }}>
                        {b.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{b.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontSize: '0.85rem', color: '#475569', fontFamily: 'monospace' }}>
                      {b.ownerPhone || '—'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: b.isActive ? '#ecfdf5' : '#fef2f2', color: b.isActive ? '#059669' : '#dc2626' }}>
                      {b.isActive ? 'Faol' : "To'xtatilgan"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: trial.bg, color: trial.color }}>
                      {trial.label}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: '#64748b', fontSize: '0.82rem' }}>
                    {new Date(b.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helpers
function getTrialInfo(trialExpiresAt?: string) {
  if (!trialExpiresAt) return { label: 'Cheksiz', color: '#6366f1', bg: '#eef2ff' };
  const diff = Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: `Muddati o'tgan`, color: '#dc2626', bg: '#fef2f2' };
  if (diff <= 7) return { label: `${diff} kun`, color: '#d97706', bg: '#fffbeb' };
  return { label: `${diff} kun`, color: '#059669', bg: '#ecfdf5' };
}

function strToColor(s: string) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#3b82f6','#10b981'];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

const spinner: React.CSSProperties = {
  width: '36px', height: '36px',
  border: '3px solid #e2e8f0',
  borderTop: '3px solid #7c3aed',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const styles: Record<string, React.CSSProperties> = {
  pageTitle: { fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '0.9rem', color: '#64748b', marginTop: '4px' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'default',
  },
  tableCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
  },
  viewAllBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#6366f1',
    cursor: 'pointer',
  },
  th: {
    padding: '11px 24px',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    background: '#f8fafc',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  td: {
    padding: '14px 24px',
    verticalAlign: 'middle',
  },
  bizAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
};
