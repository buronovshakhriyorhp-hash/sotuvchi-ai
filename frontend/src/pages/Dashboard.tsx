import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Package, UserMinus, ShoppingCart, 
  Zap, ArrowRight, AlertCircle, History, MessageCircle,
  TrendingUp, TrendingDown, DollarSign, Activity, Award, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
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

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  totalQty: number;
  totalRevenue: number;
}

interface ProfitData {
  revenue: number;
  cost: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  margin: number;
}

interface DashboardData {
  todaySales: { total: number; count: number };
  weekSales: { total: number; count: number };
  pendingDebts: { total: number; count: number };
  lowStockProducts: { id: number; name: string; stock: number }[];
  topDebtors: { id: number; amount: number; customer?: { name: string } }[];
  activeOrders: number;
  topCustomers: { id: number; name: string; total: number }[];
  balance: number;
  zeroCostProducts: number;
}

const StatCard = ({ title, value, subValue, icon: Icon, color, trend }: { title: string, value: string, subValue?: string, icon: any, color: string, trend?: { val: string, isUp: boolean } }) => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ padding: '0.75rem', background: `${color}15`, color, borderRadius: 'var(--radius)' }}>
        <Icon size={24} />
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: trend.isUp ? 'var(--success)' : 'var(--danger)', fontSize: '0.75rem', fontWeight: 700, background: trend.isUp ? 'var(--success-bg)' : 'var(--danger-bg)', padding: '0.25rem 0.5rem', borderRadius: '100px' }}>
          {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend.val}
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.25rem' }}>{value}</div>
      {subValue && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{subValue}</div>}
    </div>
  </div>
);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color, fontWeight: 700, background: 'var(--surface)', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>{item.val}</span>
              {item.actionLink && (
                <a href={item.actionLink} target="_blank" rel="noreferrer" className="telegram-action-btn" title="Telegram orqali eslatish" onClick={(e) => e.stopPropagation()}>
                  <MessageCircle size={14} />
                </a>
              )}
            </div>
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
  const { format, currency, setCurrency, syncWithBackend } = useCurrency();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDash = async () => {
    setLoading(true);
    try {
      // Sync currency rate first
      await syncWithBackend();

      const [dashRes, chartRes, topRes, profitRes] = await Promise.all([
        api.get('/reports/dashboard').catch(() => null),
        api.get('/reports/sales', { params: { groupBy: 'day' } }).catch(() => null),
        api.get('/reports/top-products', { params: { limit: 5 } }).catch(() => null),
        api.get('/reports/profit').catch(() => null)
      ]);
      
      if (dashRes) setData(dashRes);
      if (chartRes?.chart) setChartData(chartRes.chart);
      if (topRes) setTopProducts(topRes);
      if (profitRes) setProfit(profitRes);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err?.message || 'Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const salesRes = await api.get('/sales', { params: { limit: 20, search } }).catch(() => null);
      const sData = salesRes;
      setSales(sData?.sales || sData || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDash();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSales();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  if (error) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
          <AlertCircle size={48} style={{ margin: '0 auto' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Xatolik yuz berdi</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => { setError(null); fetchDash(); fetchSales(); }}>
          Qayta urinish
        </button>
      </div>
    );
  }

  if (!data && loading) {
    return (
      <div className="page-container space-y-8">
        <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
        <div className="stats-grid">
           {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '140px' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-8 pb-12">
      
      {/* 0. WARNING BANNER FOR MISSING COST PRICES */}
      {data?.zeroCostProducts && data.zeroCostProducts > 0 && (
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <AlertCircle className="text-danger" size={24} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--danger)' }}>Tannarxlar kiritilmagan!</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <b>{data.zeroCostProducts} ta</b> faol mahsulotda tannarx (cost price) 0 ga teng. Bu foyda hisobotlari noto'g'ri chiqishiga sabab bo'ladi.
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => navigate('/products/list')}>Tuzatish</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Xush kelibsiz!</h1>
              <p className="page-subtitle" style={{ fontSize: '1rem' }}>Tizimda bugungi savdo va moliyaviy holatingiz tahlili.</p>
            </div>
            
            {/* Currency Toggle */}
            <div style={{ background: 'var(--surface-2)', padding: '0.25rem', borderRadius: '12px', display: 'flex', gap: '0.25rem', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setCurrency('uzs')}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: currency === 'uzs' ? 'var(--primary)' : 'transparent', color: currency === 'uzs' ? 'var(--primary-deep)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}
              >UZS</button>
              <button 
                onClick={() => setCurrency('usd')}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: currency === 'usd' ? 'var(--primary)' : 'transparent', color: currency === 'usd' ? 'var(--primary-deep)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}
              >USD</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="btn-hero btn-hero-amber" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', flex: 1 }} onClick={() => navigate('/pos')}>
              <div className="hero-icon-circle" style={{ width: 40, height: 40 }}>
                <Zap size={20} fill="currentColor" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800 }}>Chakana (POS)</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Tezkor sotuv qilish</div>
              </div>
            </div>

            <div className="btn-hero btn-hero-secondary" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', flex: 1 }} onClick={() => setShowModal(true)}>
              <div className="hero-icon-circle" style={{ width: 40, height: 40 }}>
                <Plus size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800 }}>Ulgurji savdo</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Shartnoma tuzish</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card glass-panel" style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(255,255,255,0.5) 100%)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', background: 'var(--primary)', color: 'var(--primary-deep)', borderRadius: '20px', boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.4)' }}>
            <DollarSign size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jami naqd balans</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--primary-deep)', marginTop: '0.25rem' }}>{format(data?.balance || 0)}</div>
          </div>
          <ArrowUpRight size={24} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', opacity: 0.2, color: 'var(--primary-deep)' }} />
          
          {/* Subtle background decoration */}
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.05 }} />
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="stats-grid">
        <StatCard 
          title="Bugungi savdo" 
          value={format(data?.todaySales?.total || 0)} 
          subValue={`${data?.todaySales?.count || 0} ta chek chiqarildi`}
          icon={Activity} 
          color="var(--info)" 
          trend={{ val: '12%', isUp: true }}
        />
        <StatCard 
          title="Haftalik savdo" 
          value={format(data?.weekSales?.total || 0)} 
          subValue="So'nggi 7 kunda"
          icon={TrendingUp} 
          color="var(--primary)" 
          trend={{ val: '8.5%', isUp: true }}
        />
        <StatCard 
          title="Qarzlar balansi" 
          value={format(data?.pendingDebts?.total || 0)} 
          subValue={`${data?.pendingDebts?.count || 0} ta aktiv qarz`}
          icon={UserMinus} 
          color="var(--danger)" 
          trend={{ val: '4%', isUp: false }}
        />
        <StatCard 
          title="Sof foyda (oylik)" 
          value={format(profit?.netProfit || 0)} 
          subValue={`Rentabellik: ${profit?.margin || 0}%`}
          icon={Award} 
          color="var(--success)" 
          trend={{ val: '15%', isUp: true }}
        />
      </div>

      {/* 3. CENTER ANALYTICS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }}>
        
        {/* Sales Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Haftalik savdo dinamikasi</div>
              <div className="card-subtitle">Savdo tushumi va hajmi tahlili</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/reports')}>Barchasi <ArrowRight size={14} /></button>
          </div>
          <div style={{ height: 350, marginTop: '1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('.')} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
                  formatter={(value: any) => [format(value), 'Tushum']}
                />
                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Top Mahsulotlar</div>
            <Award size={18} className="text-muted" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
            {(topProducts || []).map((p, i) => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{p.totalQty} ta sotildi</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${(p.totalRevenue / topProducts[0].totalRevenue) * 100}%`, 
                      background: i === 0 ? 'var(--primary)' : 'var(--primary-dark)',
                      borderRadius: 4
                    }} 
                  />
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Ma'lumot mavjud emas</div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', borderRadius: 0, padding: '1rem' }} onClick={() => navigate('/reports')}>
            Barcha mahsulotlar tahlili
          </button>
        </div>
      </div>

      {/* 4. BOTTOM GRID */}
      <div className="dashboard-main-grid">
        <div className="card card-no-padding overflow-hidden">
          <div className="card-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--surface-2)', color: 'var(--text)', borderRadius: 'var(--radius)' }}>
                <History size={20} />
              </div>
              <div className="card-title">Oxirgi sotuvlar</div>
            </div>
            <div className="search-input-wrap" style={{ width: '220px' }}>
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
          <div className="table-wrapper">
             <table className="table">
                <thead>
                  <tr>
                    <th>Sotuv #</th>
                    <th>Mijoz</th>
                    <th style={{ textAlign: 'right' }}>Jami</th>
                    <th style={{ textAlign: 'right' }}>Vaqti</th>
                  </tr>
                </thead>
                <tbody>
                  {(sales || []).map((s) => (
                    <tr key={s.id} onClick={() => navigate(`/products/sales`)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>#{s.receiptNo}</td>
                      <td className="font-semibold">{s.customer?.name || 'Chakana mijoz'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{format(s.total)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {new Date(s.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>

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
            title="Kutilayotgan qarzlar"
            icon={UserMinus}
            color="var(--primary-dark)"
            items={data?.topDebtors?.map(d => ({ 
               id: d.id, 
               name: d.customer?.name || "Noma'lum", 
               val: format(d.amount)
            }))}
            emptyMsg="Faol qarzlar yo'q"
            onViewAll={() => navigate('/debts')}
          />
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <NewSaleModal 
          onClose={() => setShowModal(false)} 
          onSaved={() => { fetchDash(); fetchSales(); setShowModal(false); }} 
        />
      )}
    </div>
  );
}
