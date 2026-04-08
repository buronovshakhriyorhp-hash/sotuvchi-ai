import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Package, UserMinus, ShoppingCart, 
  Zap, ArrowRight, AlertCircle, History
} from 'lucide-react';
import api from '../api/axios';
import useCurrency from '../store/useCurrency';
import NewSaleModal from '../components/NewSaleModal';

// --- Sub-components ---

interface Sale {
  id: number;
  receiptNo: string;
  status: string;
  total: number;
  debtAmount: number;
  createdAt: string;
  customer?: { name: string };
}

interface DashboardData {
  lowStockProducts: { id: number; name: string; stock: number }[];
  topDebtors: { id: number; amount: number; customer?: { name: string } }[];
  activeOrders: number;
}

const QuickAlert = ({ title, icon: Icon, color, items, emptyMsg, onViewAll }: { 
  title: string, icon: any, color: string, items?: any[], emptyMsg: string, onViewAll?: () => void 
}) => (
  <div className="card card-no-padding overflow-hidden">
    <div className="card-header" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ padding: '0.5rem', background: `${color}15`, color, borderRadius: 'var(--radius-sm)' }}>
          <Icon size={20} />
        </div>
        <div className="card-title" style={{ fontSize: '0.9375rem' }}>{title}</div>
      </div>
    </div>
    <div style={{ padding: '1rem' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
        {items && items.length > 0 ? items.map((item: any) => (
          <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', background:'var(--surface-2)', padding:'0.75rem 1rem', borderRadius:'var(--radius-sm)', fontSize:'0.8125rem' }}>
            <span style={{ fontWeight:600, color: 'var(--text)' }}>{item.name}</span>
            <span style={{ color, fontWeight: 700, background: 'var(--surface)', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>{item.val}</span>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <AlertCircle size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '0.5rem' }} />
            <div style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>{emptyMsg}</div>
          </div>
        )}
      </div>
    </div>
    {onViewAll && items && items.length > 0 && (
      <button 
        className="btn btn-ghost btn-sm w-full" 
        style={{ borderRadius: 0, borderTop: '1px solid var(--border-subtle)', padding: '0.75rem' }}
        onClick={onViewAll}
      >
        Barchasini ko'rish <ArrowRight size={14} style={{ marginLeft: '4px' }} />
      </button>
    )}
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { format } = useCurrency();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEverything = async () => {
    setLoading(true);
    try {
      const [dashRes, salesRes] = await Promise.all([
        api.get('/reports/dashboard').catch(() => null),
        api.get('/sales', { params: { limit: 20 } }).catch(() => null)
      ]);
      
      if (dashRes) setData(dashRes.data);
      const sData = salesRes?.data;
      setSales(sData?.sales || sData || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEverything();
  }, []);

  const filteredSales = sales.filter(s => {
    const term = search.toLowerCase();
    return String(s.receiptNo).toLowerCase().includes(term) ||
           (s.customer?.name || '').toLowerCase().includes(term);
  });

  if (!data && loading) return <div className="p-8 text-center text-muted">Yuklanmoqda...</div>;

  return (
    <div className="fade-in space-y-8">
      {/* 1. HERO ACTION ZONE */}
      <div className="dashboard-actions-grid">
        <div className="btn-hero btn-hero-amber" onClick={() => navigate('/pos')}>
          <div className="hero-icon-circle">
            <Zap size={28} fill="currentColor" />
          </div>
          <span>Chakana savdo (POS)</span>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, marginTop: '-4px' }}>Mijoz uchun tezkor chek chiqarish</p>
        </div>

        <div className="btn-hero btn-hero-secondary" onClick={() => setShowModal(true)}>
          <div className="hero-icon-circle">
            <Plus size={28} />
          </div>
          <span>Yangi sotuv</span>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: '-4px' }}>Ulgurji yoki maxsus shartnoma</p>
        </div>
      </div>

      {/* 2. MAIN GRID SECTION */}
      <div className="dashboard-main-grid">
        
        {/* LEFT SECTON: Recent Sales */}
        <div className="space-y-4">
          <div className="card card-no-padding">
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)' }}>
                  <History size={20} />
                </div>
                <div>
                  <div className="card-title">Oxirgi sotuvlar</div>
                  <div className="card-subtitle">Bugungi savdo harakatlari</div>
                </div>
              </div>
              
              <div className="search-input-wrap" style={{ width: '240px' }}>
                <Search size={14} className="input-icon" />
                <input 
                  className="input-field" 
                  placeholder="Qidirish..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.8125rem' }} 
                />
              </div>
            </div>

            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table table-hover" style={{ fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th>Sotuv #</th>
                    <th>Mijoz</th>
                    <th>Holati</th>
                    <th style={{ textAlign: 'right' }}>Jami</th>
                    <th style={{ textAlign: 'right' }}>Vaqti</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.slice(0, 10).map((s) => (
                    <tr key={s.id} onClick={() => navigate(`/products/sales`)} style={{ cursor: 'pointer' }}>
                      <td data-label="Sotuv #" style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>#{s.receiptNo}</td>
                      <td data-label="Mijoz" className="font-semibold">{s.customer?.name || 'Chakana mijoz'}</td>
                      <td data-label="Holati">
                        <span className={`badge ${s.status === 'cancelled' ? 'badge-danger' : 'badge-active'}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                          {s.status === 'cancelled' ? 'Bekor' : 'Yakunlandi'}
                        </span>
                      </td>
                      <td data-label="Jami" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text)' }}>{format(s.total)}</td>
                      <td data-label="Vaqti" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {new Date(s.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted">Ayni damda sotuvlar mavjud emas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ padding: '1rem 1.5rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'center' }}>
               <button className="btn btn-ghost btn-sm font-bold" onClick={() => navigate('/products/sales')}>Barcha sotuvlarni ko'rish</button>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Quick Alerts & Reminders */}
        <div className="space-y-6">
          <QuickAlert 
            title="Tugayotgan mahsulotlar"
            icon={Package}
            color="var(--danger)"
            items={data?.lowStockProducts?.map(p => ({ id: p.id, name: p.name, val: `${p.stock} ta` }))}
            emptyMsg="Barcha mahsulotlar yetarli"
            onViewAll={() => navigate('/warehouse')}
          />

          <QuickAlert 
            title="Yaqin orasidagi qarzlar"
            icon={UserMinus}
            color="var(--primary-dark)"
            items={data?.topDebtors?.map(d => ({ id: d.id, name: d.customer?.name || "Noma'lum", val: format(d.amount) }))}
            emptyMsg="Hozircha faol qarzlar yo'q"
            onViewAll={() => navigate('/debts')}
          />

          {data?.activeOrders !== undefined && data.activeOrders > 0 && (
            <div className="card" style={{ background: 'var(--info-bg)', borderColor: 'var(--info)', cursor: 'pointer' }} onClick={() => navigate('/orders')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#fff', color: 'var(--info)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{data.activeOrders}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--info)', textTransform: 'uppercase' }}>Aktiv buyurtmalar</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODALS */}
      {showModal && (
        <NewSaleModal 
          onClose={() => setShowModal(false)} 
          onSaved={() => { fetchEverything(); setShowModal(false); }} 
        />
      )}
    </div>
  );
}
