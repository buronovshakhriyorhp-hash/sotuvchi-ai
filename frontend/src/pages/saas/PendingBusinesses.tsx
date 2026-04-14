import React, { useEffect, useState } from 'react';
import { 
  Loader2, CheckCircle, Clock, Building, User, Phone, 
  Calendar, CheckCircle2, ShieldAlert, Rocket, Info 
} from 'lucide-react';
import { saasApi, Business } from '../../api/saas.api';
import useToast from '../../store/useToast';

export default function PendingBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await saasApi.getPendingBusinesses();
      setBusinesses(data);
    } catch (err) {
      console.error('Pending fetch error:', err);
      toast.error('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setApproving(id);
      await saasApi.approveBusiness(id);
      toast.success('Biznes muvaffaqiyatli tasdiqlandi');
      setBusinesses(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      toast.error('Tasdiqlashda xatolik yuz berdi');
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <div className="page-title-box" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Tasdiq Kutayotganlar
          </h1>
          <p className="page-subtitle" style={{ fontSize: '1.1rem' }}>
            Yangi ro'yxatdan o'tgan bizneslarni ko'rib chiqish va faollashtirish
          </p>
        </div>
        
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          color: '#f59e0b', 
          padding: '0.75rem 1.25rem', 
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem',
          fontWeight: 700,
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
           <ShieldAlert size={20} />
           {businesses.length} ta kutilayotgan so'rov
        </div>
      </div>

      <div className="card glass-card shadow-sm" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '24px' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
          <table className="table">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Biznes Ma'lumotlari</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Telefon</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Slug / URL</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sana</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                      <div className="animate-spin" style={{ color: 'var(--primary)' }}>
                        <Loader2 size={40} />
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Ma'lumotlar yuklanmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '6rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.6 }}>
                       <CheckCircle2 size={48} color="#10b981" />
                       <h3 style={{ margin: 0 }}>Barcha so'rovlar ko'rib chiqilgan</h3>
                       <p style={{ margin: 0, fontSize: '0.9rem' }}>Hozirda kutilayotgan yangi bizneslar yo'q</p>
                    </div>
                  </td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr key={b.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: 44, 
                          height: 44, 
                          borderRadius: '14px', 
                          background: 'var(--surface-2)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--primary)'
                        }}>
                          <Building size={22} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{b.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Rocket size={12} /> ID: TN-{b.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        <Phone size={14} className="text-muted" />
                        {b.ownerPhone || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <div style={{ 
                        padding: '0.4rem 0.75rem', 
                        background: 'var(--surface-2)', 
                        borderRadius: '8px', 
                        fontSize: '0.85rem', 
                        fontFamily: 'monospace',
                        display: 'inline-block',
                        border: '1px solid var(--border)'
                      }}>
                        {b.slug}.nexuserp.uz
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                         <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date(b.createdAt).toLocaleDateString('uz-UZ')}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                         <button className="btn-icon" style={{ background: 'var(--surface-2)' }}>
                            <Info size={16} />
                         </button>
                         <button
                           className="btn btn-primary"
                           onClick={() => handleApprove(b.id)}
                           disabled={approving === b.id}
                           style={{ 
                             display: 'inline-flex', 
                             alignItems: 'center', 
                             gap: '0.6rem', 
                             padding: '0.6rem 1.25rem',
                             borderRadius: '12px',
                             boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                           }}
                         >
                           {approving === b.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                           Tasdiqlash
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
