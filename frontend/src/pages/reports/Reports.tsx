import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Download, TrendingUp, TrendingDown, DollarSign, Users, 
  ShoppingCart, Calendar, AlertCircle, ShoppingBag, CreditCard, Banknote
} from 'lucide-react';
import api from '../../api/axios';
import useCurrency from '../../store/useCurrency';
import PageLoader from '../../components/PageLoader';

const COLORS = ['#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];
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
  const [data, setData] = useState<any>(null);

  const fetchReports = async (p: string) => {
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

      const [dashRes, salesRes, profitRes] = await Promise.all([
        api.get('/reports/dashboard', { params: { from: fromStr, to: toStr } }),
        api.get('/reports/sales', { params: { from: fromStr, to: toStr } }),
        api.get('/reports/profit', { params: { from: fromStr, to: toStr } }),
      ]);

      setData({
        dash: dashRes,
        sales: salesRes,
        profit: profitRes
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

  if (loading || !data) return <PageLoader />;

  const KPICard = ({ label, value, sub, icon: Icon, bg, color, trend, up }: any) => (
    <div className="card stat-card" style={{ padding: '1.25rem' }}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs font-bold text-muted uppercase tracking-wider">{label}</div>
          <div className="text-xl mt-1 font-extrabold flex items-baseline gap-1">
            {value} <span className="text-xs text-muted font-medium">{sub}</span>
          </div>
        </div>
        <div style={{ background: bg, width: 40, height: 40, borderRadius: '10px' }} className="flex items-center justify-center">
          <Icon size={20} color={color}/>
        </div>
      </div>
      <div className={`mt-3 flex items-center gap-1 text-[11px] font-bold ${up ? 'text-success' : 'text-danger'}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{trend} o'tgan davrga nisbatan</span>
      </div>
    </div>
  );

  // Backend'dan kelgan to'lov taqsimoti (reports.js bilan sinxron)
  const paymentData = [
    { name: "Naqd",    value: data?.dash?.paymentBreakdown?.cash || 0,  color: '#fbbf24' },
    { name: "Karta",   value: data?.dash?.paymentBreakdown?.card || 0,  color: '#10b981' },
    { name: "Bank",    value: data?.dash?.paymentBreakdown?.bank || 0,  color: '#3b82f6' },
    { name: "Qarzga",  value: data?.dash?.paymentBreakdown?.debt || 0,  color: '#8b5cf6' },
  ].filter(i => i.value > 0);

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-title-box items-center">
        <div>
          <h1 className="page-title">Biznes Tahlili</h1>
          <p className="page-subtitle">Real vaqtdagi moliyaviy va operatsion ko'rsatkichlar</p>
        </div>
        <div className="flex gap-2 bg-surface p-1 rounded-xl shadow-sm border border-border">
          {PERIODS.map(p => (
            <button 
              key={p.id} 
              onClick={() => setPeriod(p.id)} 
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === p.id ? 'bg-primary text-primary-deep shadow-sm' : 'text-muted hover:bg-surface-2'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Row */}
      {((data?.dash?.alerts?.lowStock || 0) > 0 || (data?.dash?.alerts?.upcomingDebts?.length || 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.dash?.alerts?.lowStock || 0) > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
               <div className="p-2 bg-amber-200 rounded-lg"><AlertCircle size={20}/></div>
               <div>
                  <div className="text-sm font-bold">{(data?.dash?.alerts?.lowStock || 0)} ta mahsulot tugamoqda!</div>
                  <div className="text-xs opacity-80">Zaxirani to'ldirish tavsiya etiladi</div>
               </div>
            </div>
          )}
          {(data?.dash?.alerts?.upcomingDebts?.length || 0) > 0 && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
               <div className="p-2 bg-rose-200 rounded-lg"><DollarSign size={20}/></div>
               <div>
                  <div className="text-sm font-bold">Qarz to'lov muddati yaqin!</div>
                  <div className="text-xs opacity-80">{(data?.dash?.alerts?.upcomingDebts[0]?.name)} va boshqalar...</div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Umumiy Sotuv" value={format(data?.sales?.totalRevenue || 0)} sub={unit()} icon={ShoppingCart} bg="#fef9c3" color="#b45309" trend="+14%" up={true} />
        <KPICard label="Sof Foyda" value={format(data?.profit?.netProfit || 0)} sub={unit()} icon={TrendingUp} bg="#dcfce7" color="#15803d" trend="+12%" up={true} />
        <KPICard label="Xarajatlar" value={format(data?.profit?.expenses || 0)} sub={unit()} icon={Banknote} bg="#fee2e2" color="#b91c1c" trend="-2%" up={false} />
        <KPICard label="Balans (Kassa)" value={format(data?.dash?.balance || 0)} sub={unit()} icon={CreditCard} bg="#e0f2fe" color="#0369a1" trend="+5%" up={true} />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <div>
              <div className="card-title text-sm uppercase tracking-widest text-muted">Sotuv Dinamikasi</div>
              <div className="text-2xl font-black mt-1">{format(data.sales.totalRevenue)} <span className="text-sm font-medium">{unit()}</span></div>
            </div>
          </div>
          <div style={{ height: 320, width: '100%', marginTop: '1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.sales.chart}>
                <defs>
                   <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                  formatter={(v: any) => [format(v), 'Summa']}
                />
                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Analytics Side */}
        <div className="space-y-6">
          {/* Payment Breakdown */}
          <div className="card">
             <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">To'lov Taqsimoti</div>
             <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={paymentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                         {paymentData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => format(v)} />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-4 grid grid-cols-2 gap-2">
                {paymentData.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
                     <div style={{ width: 8, height: 8, borderRadius: '2px', background: p.color }} />
                     <div className="text-[10px]">
                        <div className="text-muted font-medium">{p.name}</div>
                        <div className="font-bold">{format(p.value)}</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Top Customers */}
          <div className="card">
             <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Top Mijozlar</div>
             <div className="space-y-3">
                {(data?.dash?.topCustomers || []).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-surface-2 transition-all rounded-xl cursor-default border border-transparent hover:border-border">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-[10px] font-bold text-primary-dark border border-primary-hover">
                           {i + 1}
                        </div>
                        <div>
                           <div className="text-xs font-bold">{c.name}</div>
                           <div className="text-[10px] text-muted">Muntazam mijoz</div>
                        </div>
                     </div>
                     <div className="text-xs font-black">{format(c.total)}</div>
                  </div>
                ))}
                {(data?.dash?.topCustomers?.length || 0) === 0 && <div className="text-center py-4 text-xs text-muted">Ma'lumot yo'q</div>}
             </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="card overflow-hidden !p-0">
         <div className="p-4 bg-surface border-bottom border-border flex justify-between items-center">
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Kunlik ko'rsatkichlar tahlili</div>
            <button className="btn btn-sm btn-ghost"><Download size={14}/> CSV Yuklash</button>
         </div>
         <div className="table-wrapper !border-none !rounded-none">
            <table className="table">
               <thead>
                  <tr>
                     <th>Sana</th>
                     <th className="text-right">Sotuv Summasi</th>
                     <th className="text-right">Tranzaktsiyalar</th>
                     <th className="text-right">O'rtacha Chek</th>
                  </tr>
               </thead>
               <tbody>
                  {[...(data?.sales?.chart || [])].reverse().map((s, i) => (
                    <tr key={i}>
                       <td className="font-bold text-xs" data-label="Sana">{s.date}</td>
                       <td className="text-right font-black" data-label="Summa">{format(s.total)}</td>
                       <td className="text-right" data-label="Tranzaktsiyalar">{s.count} ta</td>
                       <td className="text-right font-medium text-success" data-label="O'rtacha Chek">{format(s.count > 0 ? s.total / s.count : 0)}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
