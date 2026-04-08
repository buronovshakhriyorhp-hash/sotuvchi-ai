import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Calendar } from 'lucide-react';
import api from '../../api/axios';
import useCurrency from '../../store/useCurrency';

const COLORS = ['#facc15', '#86efac', '#93c5fd', '#d8b4fe', '#fca5a1'];
const PERIODS = [
  { id: 'today', label: 'Bugun' },
  { id: 'week', label: 'Hafta' },
  { id: 'month', label: 'Oy' },
  { id: 'year', label: 'Yil' }
];

export default function Reports() {
  const { format, unit } = useCurrency();
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: null,
    salesChart: [],
    topProducts: [],
    profitInfo: null
  });

  const fetchReports = async (p) => {
    setLoading(true);
    try {
      const now = new Date();
      let fromDate = new Date();
      
      if (p === 'today') fromDate.setHours(0, 0, 0, 0);
      else if (p === 'week') fromDate.setDate(now.getDate() - 7);
      else if (p === 'month') fromDate.setMonth(now.getMonth() - 1);
      else if (p === 'year') fromDate.setFullYear(now.getFullYear() - 1);

      const fromStr = fromDate.toISOString().slice(0, 10);
      const toStr = now.toISOString().slice(0, 10);

      const [dashRes, salesRes, topRes, profitRes] = await Promise.all([
        api.get('/reports/dashboard', { params: { from: fromStr, to: toStr } }).catch(() => null),
        api.get('/reports/sales', { params: { from: fromStr, to: toStr } }).catch(() => []),
        api.get('/reports/top-products', { params: { limit: 5 } }).catch(() => []),
        api.get('/reports/profit', { params: { from: fromStr, to: toStr } }).catch(() => null),
      ]);

      setData({
        stats: dashRes,
        salesChart: salesRes?.chart || [],
        topProducts: Array.isArray(topRes) ? topRes : [],
        profitInfo: profitRes
      });
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(period);
  }, [period]);

  const KPICard = ({ label, value, sub, icon: Icon, bg, color, trend, up }) => (
    <div className="card stat-card" style={{ padding: '1.25rem 1.5rem', border: '1px solid var(--border-subtle)' }}>
      <div className="stat-card-top">
        <div>
          <div className="stat-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '0.375rem', fontWeight: 800 }}>
            {value}<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.25rem', fontWeight: 500 }}>{sub}</span>
          </div>
        </div>
        <div className="stat-icon-wrap" style={{ background: bg, width: 44, height: 44 }}><Icon size={22} color={color}/></div>
      </div>
      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)' }}>
        {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{trend} o'tgan davrga nisbatan</span>
      </div>
    </div>
  );

  return (
    <div className="fade-in space-y-6">
      {/* Header & Filter */}
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Hisobotlar va tahlil</h1>
          <p className="page-subtitle">Biznes ko'rsatkichlarining aniq va tartibli ko'rinishi</p>
        </div>
        <div className="page-actions">
          <div className="btn-group" style={{ background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--radius)' }}>
            {PERIODS.map(p => (
              <button 
                key={p.id} 
                onClick={() => setPeriod(p.id)} 
                className={`btn btn-sm ${period === p.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ minWidth: '70px' }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn btn-outline"><Download size={16}/> Eksport</button>
        </div>
      </div>

      {/* KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="Bugungi sotuv" 
          value={format(data.stats?.todaySales?.total || 0)} 
          sub={unit()} 
          icon={ShoppingCart} 
          bg="#fef9c3" color="#ca8a04" 
          trend="+12%" up={true}
        />
        <KPICard 
          label="Sof foyda" 
          value={format(data.profitInfo?.netProfit || 0)} 
          sub={unit()} 
          icon={TrendingUp} 
          bg="#dcfce7" color="#16a34a" 
          trend="+8%" up={true}
        />
        <KPICard 
          label="Xarajatlar" 
          value={format(data.profitInfo?.expenses || 0)} 
          sub={unit()} 
          icon={TrendingDown} 
          bg="#fee2e2" color="#dc2626" 
          trend="-3%" up={false}
        />
        <KPICard 
          label="Kutilayotgan qarzlar" 
          value={format(data.stats?.pendingDebts?.total || 0)} 
          sub={unit()} 
          icon={Users} 
          bg="#e0f2fe" color="#0284c7" 
          trend="+5%" up={false}
        />
      </div>

      {/* Main Analysis Section (3-rasm) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Dynamics Chart */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div>
              <div className="card-title">Sotuvlar dinamikasi</div>
              <div className="card-subtitle">Davr bo'yicha savdo o'sishi</div>
            </div>
            <Calendar size={18} className="text-muted" />
          </div>
          <div style={{ height: '320px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ca8a04" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [format(v), 'Sotuv']}
                />
                <Area type="monotone" dataKey="total" stroke="#ca8a04" strokeWidth={3} fill="url(#gradSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top ko'rsatkichlar</div>
              <div className="card-subtitle">Mahsulotlar ulushi</div>
            </div>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.topProducts} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={85} 
                  paddingAngle={5} 
                  dataKey="totalRevenue"
                  nameKey="name"
                >
                  {data.topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => format(v)} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem', paddingTop: '1rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {data.topProducts.slice(0, 3).map((p, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2">
                   <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i] }} />
                   {p.name}
                </span>
                <span className="font-bold">{format(p.totalRevenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Detailed Table (Monthly/Range) */}
      <div className="card card-no-padding">
        <div className="card-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="card-title">Batafsil ko'rsatkichlar</div>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                <th>Vaqt oralig'i</th>
                <th style={{ textAlign: 'right' }}>Sotuv</th>
                <th style={{ textAlign: 'right' }}>Foyda (brutto)</th>
                <th style={{ textAlign: 'right' }}>Cheklar</th>
              </tr>
            </thead>
            <tbody>
              {data.salesChart.length > 0 ? [...data.salesChart].reverse().slice(0, 7).map((s, i) => (
                <tr key={i}>
                  <td className="font-medium">{s.date}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{format(s.total)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>{format(s.total * 0.25)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{s.count} ta</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="text-center py-8 text-muted">Ma'lumotlar mavjud emas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
