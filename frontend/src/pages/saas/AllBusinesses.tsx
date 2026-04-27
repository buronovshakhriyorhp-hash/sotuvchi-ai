import React, { useEffect, useState } from 'react';
import { saasApi, Business, SaaSUser } from '../../api/saas.api';
import useToast from '../../store/useToast';

type Filter = 'all' | 'active' | 'pending' | 'expired';

export default function AllBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [bizUsers, setBizUsers] = useState<SaaSUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setBusinesses(await saasApi.getAllBusinesses());
    } catch { toast.error("Ma'lumotlarni yuklashda xatolik"); }
    finally { setLoading(false); }
  };

  const openUsers = async (biz: Business) => {
    setSelectedBiz(biz); setLoadingUsers(true); setBizUsers([]);
    try { setBizUsers(await saasApi.getBusinessUsers(biz.id)); }
    catch { toast.error('Xodimlarni yuklashda xatolik'); }
    finally { setLoadingUsers(false); }
  };

  const handleSuspend = async (b: Business) => {
    if (!confirm(`"${b.name}" ni ${b.isActive ? "to'xtatmoqchimisiz" : 'qayta faollashtirmoqchimisiz'}?`)) return;
    try {
      setActionLoading(b.id);
      await saasApi.suspendBusiness(b.id, b.isActive);
      toast.success(b.isActive ? "Biznes to'xtatildi" : 'Biznes faollashtirildi');
      fetchAll();
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setActionLoading(null); }
  };

  const handleExtend = async (b: Business) => {
    try {
      setActionLoading(b.id);
      await saasApi.extendTrial(b.id, 30);
      toast.success("Trial 30 kunga uzaytirildi");
      fetchAll();
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setActionLoading(null); }
  };

  const getTrialInfo = (trialExpiresAt?: string) => {
    if (!trialExpiresAt) return { label: 'Cheksiz', color: '#6366f1', bg: '#eef2ff' };
    const diff = Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { label: `Muddati o'tgan`, color: '#dc2626', bg: '#fef2f2' };
    if (diff <= 7) return { label: `${diff} kun`, color: '#d97706', bg: '#fffbeb' };
    return { label: `${diff} kun`, color: '#059669', bg: '#ecfdf5' };
  };

  const filtered = businesses.filter(b => {
    const q = search.toLowerCase();
    const match = b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q) || (b.ownerPhone || '').includes(q);
    if (filter === 'active') return match && b.isActive && b.isApproved;
    if (filter === 'pending') return match && !b.isApproved;
    if (filter === 'expired') return match && !!b.trialExpiresAt && new Date(b.trialExpiresAt) < new Date();
    return match;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={st.pageTitle}>Barcha Bizneslar</h1>
        <p style={st.pageSub}>Jami {businesses.length} ta tenant ro'yxatga olingan</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={st.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Nomi, slug yoki telefon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={st.searchInput}
          />
        </div>
        <div style={st.filterGroup}>
          {(['all', 'active', 'pending', 'expired'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...st.filterBtn, ...(filter === f ? st.filterBtnActive : {}) }}>
              {f === 'all' ? 'Barchasi' : f === 'active' ? 'Faol' : f === 'pending' ? 'Kutilmoqda' : "Muddati o'tgan"}
            </button>
          ))}
        </div>
        <button onClick={fetchAll} style={st.refreshBtn}>
          ↻ Yangilash
        </button>
      </div>

      {/* Table */}
      <div style={st.tableCard}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Biznes', 'Egasi', 'Trial', 'Holati', 'Qo\'shilgan', 'Amallar'].map(h => (
                <th key={h} style={st.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                <div style={spinnerStyle} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '0.9rem' }}>
                Hech qanday biznes topilmadi
              </td></tr>
            ) : filtered.map(b => {
              const trial = getTrialInfo(b.trialExpiresAt);
              const isLoading = actionLoading === b.id;
              return (
                <tr key={b.id} style={st.tr}>
                  <td style={st.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ ...st.bizAvatar, background: strToColor(b.name) }}>
                        {b.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{b.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{b.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...st.td, fontFamily: 'monospace', fontSize: '0.82rem', color: '#475569' }}>
                    {b.ownerPhone || '—'}
                  </td>
                  <td style={st.td}>
                    <span style={{ ...st.badge, background: trial.bg, color: trial.color }}>
                      {trial.label}
                    </span>
                  </td>
                  <td style={st.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: b.isActive ? '#10b981' : '#ef4444' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: b.isActive ? '#059669' : '#dc2626' }}>
                        {b.isActive ? 'Faol' : "To'xtatilgan"}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...st.td, color: '#64748b', fontSize: '0.8rem' }}>
                    {new Date(b.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td style={{ ...st.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openUsers(b)} style={st.actionBtn} title="Xodimlar">
                        👥
                      </button>
                      <button onClick={() => handleExtend(b)} disabled={isLoading} style={st.actionBtn} title="Trialni uzaytir">
                        ⏱
                      </button>
                      <button
                        onClick={() => handleSuspend(b)}
                        disabled={isLoading}
                        style={{ ...st.actionBtn, background: b.isActive ? '#fef2f2' : '#ecfdf5', color: b.isActive ? '#dc2626' : '#059669' }}
                        title={b.isActive ? "To'xtatish" : "Faollashtirish"}
                      >
                        {isLoading ? '...' : b.isActive ? '🚫' : '✅'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Users Modal */}
      {selectedBiz && (
        <div style={st.overlay} onClick={() => setSelectedBiz(null)}>
          <div style={st.modal} onClick={e => e.stopPropagation()}>
            <div style={st.modalHead}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{selectedBiz.name} — Xodimlar</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Jami {bizUsers.length} ta foydalanuvchi</div>
              </div>
              <button onClick={() => setSelectedBiz(null)} style={st.closeBtn}>✕</button>
            </div>
            <div style={st.modalBody}>
              {loadingUsers ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><div style={spinnerStyle} /></div>
              ) : bizUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Foydalanuvchilar topilmadi</div>
              ) : bizUsers.map(u => (
                <div key={u.id} style={st.userRow}>
                  <div style={st.userAvatar}>{u.name[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{u.phone}</div>
                  </div>
                  <span style={{ ...st.badge, background: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }}>
                    {u.role === 'ADMIN' ? 'Admin' : u.role}
                  </span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.isActive ? '#10b981' : '#ef4444' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function strToColor(s: string) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#3b82f6','#10b981'];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

const spinnerStyle: React.CSSProperties = {
  width: '28px', height: '28px',
  border: '3px solid #e2e8f0',
  borderTop: '3px solid #7c3aed',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  margin: '0 auto',
};

const st: Record<string, React.CSSProperties> = {
  pageTitle: { fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 },
  pageSub: { fontSize: '0.875rem', color: '#64748b', marginTop: '4px' },
  searchWrap: { position: 'relative', flex: 1, minWidth: '260px' },
  searchInput: {
    width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px',
    border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
    color: '#0f172a',
  },
  filterGroup: { display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' },
  filterBtn: {
    padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
    border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  filterBtnActive: { background: '#fff', color: '#6366f1', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  refreshBtn: {
    height: '40px', padding: '0 16px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600,
    background: '#fff', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  tableCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' },
  th: {
    padding: '10px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left',
  },
  tr: { borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' },
  td: { padding: '14px 20px', verticalAlign: 'middle' },
  bizAvatar: {
    width: '32px', height: '32px', borderRadius: '8px',
    color: '#fff', fontSize: '0.8rem', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
  actionBtn: {
    width: '32px', height: '32px', border: '1px solid #e2e8f0',
    borderRadius: '6px', background: '#f8fafc', cursor: 'pointer',
    fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
    zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
  },
  modalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
  },
  modalBody: { overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' },
  closeBtn: {
    background: '#f1f5f9', border: 'none', borderRadius: '6px',
    width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b',
  },
  userRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 12px', borderRadius: '8px', background: '#f8fafc',
  },
  userAvatar: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: '#e2e8f0', color: '#475569', fontSize: '0.8rem',
    fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
