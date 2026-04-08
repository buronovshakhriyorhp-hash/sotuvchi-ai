import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowDownLeft, ArrowUpRight, AlertTriangle, X } from 'lucide-react';
import api from '../../api/axios';
import useToast from '../../store/useToast';

export default function Warehouse() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [stockStats, setStockStats] = useState({ productsCount: 0, lowStock: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [showInModal, setShowInModal] = useState(false);
  const [inForm, setInForm] = useState({ productId: '', quantity: '', reason: '' });
  const [products, setProducts] = useState([]);
  const [inSaving, setInSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, stockRes, prodRes] = await Promise.all([
        api.get('/warehouse', { params: { type: typeFilter === 'all' ? undefined : typeFilter, limit: 100 } }),
        api.get('/warehouse/stock').catch(() => null),
        api.get('/products', { params: { status: 'active', limit: 1000 } }).catch(() => []),
      ]);
      const txList = Array.isArray(txRes) ? txRes : (txRes?.data || txRes?.transactions || []);
      setTransactions(txList);
      const stockData = stockRes?.data || (Array.isArray(stockRes) ? stockRes : []);
      setStockStats({
        productsCount: stockData.length || 0,
        lowStock: stockRes?.lowStock || [],
        totalValue: stockRes?.totalValue || 0,
      });
      const prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.products || prodRes?.data || []);
      setProducts(prodList);
    } catch (err) {
      console.error('Warehouse fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) { toast.warning("Eksport qilish uchun ma'lumot yo'q"); return; }
    const headers = ['ID','Sana','Turi','Mahsulot','Sabab','Miqdor','Mas\'ul'];
    const rows = transactions.map(t => [
      `TRX-${t.id}`,
      new Date(t.createdAt).toLocaleString('uz-UZ'),
      t.type === 'IN' ? 'Kirim' : 'Chiqim',
      t.product?.name || '-',
      t.reason || '-',
      `${t.type === 'IN' ? '+' : '-'}${t.quantity}`,
      t.user?.name || '-'
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ombor_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV fayl yuklab olindi');
  };

  const handleNewIn = async (e) => {
    e.preventDefault();
    if (!inForm.productId) return toast.error('Mahsulot tanlang!');
    if (!inForm.quantity || Number(inForm.quantity) <= 0) return toast.error('Miqdor musbat bo\'lishi kerak!');
    setInSaving(true);
    try {
      await api.post('/warehouse/in', {
        productId: Number(inForm.productId),
        quantity: Number(inForm.quantity),
        reason: inForm.reason || 'Yangi kirim'
      });
      toast.success('Kirim muvaffaqiyatli qayd etildi!');
      setShowInModal(false);
      setInForm({ productId: '', quantity: '', reason: '' });
      fetchData();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Kirim qo\'shib bo\'lmadi');
    } finally {
      setInSaving(false);
    }
  };

  const filtered = transactions.filter(t => {
    const matchSearch = String(t.id).toLowerCase().includes(search.toLowerCase()) || 
                        (t.product?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalIn  = transactions.filter(t=>t.type==='IN').reduce((a,b)=>a+b.quantity,0);
  const totalOut = transactions.filter(t=>t.type==='OUT').reduce((a,b)=>a+b.quantity,0);

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Omborlar ro'yxati</h1>
          <p className="page-subtitle">Kirim va chiqim operatsiyalari tarixi</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={exportCSV} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>Excel</button>
          <button className="btn btn-primary" onClick={() => setShowInModal(true)} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><Plus size={16}/> Yangi kirim</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom:'1.25rem' }}>
        {[
          { label:'Jami mahsulot turi', value:`${stockStats.productsCount} ta`, iconBg:'#fef9c3', color:'var(--primary-dark)' },
          { label:'Kirim (shu ro\'yxat)',      value:`+${totalIn} ta`, iconBg:'#dcfce7', color:'var(--success)' },
          { label:'Chiqim (shu ro\'yxat)',     value:`-${totalOut} ta`, iconBg:'#fee2e2', color:'var(--danger)' },
          { label:'Kam qolgan',         value:`${stockStats.lowStock.length} ta`, iconBg:'#fef3c7', color:'var(--warning)' },
        ].map((s,i)=>(
          <div key={i} className="card" style={{ padding:'1rem 1.5rem' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize:'1.5rem', color: s.color, marginTop:'0.375rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {stockStats.lowStock.length > 0 && (
        <div style={{ background:'var(--warning-bg)', border:'1px solid #fde68a', borderRadius:'var(--radius)', padding:'0.875rem 1.25rem', marginBottom:'1.25rem', display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink:0 }} />
          <span style={{ fontSize:'0.875rem', color:'var(--warning)', fontWeight:500 }}>
            <strong>{stockStats.lowStock.length} ta mahsulot</strong> minimal qoldiqdan pastga tushib ketdi. Zudlik bilan buyurtma bering!
          </span>
        </div>
      )}

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <div className="search-input-wrap">
            <Search size={15} className="input-icon"/>
            <input className="input-field" placeholder="Mahsulot yoki tranzaksiya ID..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:'2.5rem' }}/>
          </div>
          <div style={{ display:'flex', gap:'0.375rem' }}>
            {[['all','Barchasi'],['IN','Kirim'],['OUT','Chiqim']].map(([val,lbl])=>(
              <button key={val} onClick={()=>setTypeFilter(val)} className={`btn btn-sm ${typeFilter===val?'btn-primary':'btn-outline'}`}>{lbl}</button>
            ))}
          </div>
        </div>

        <div className="table-wrapper" style={{ border:'none', borderRadius:0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tranzaksiya ID</th>
                <th>Sana va vaqt</th>
                <th>Turi</th>
                <th>Mahsulot</th>
                <th>Sabab / Izoh</th>
                <th style={{ textAlign:'right' }}>Miqdori</th>
                <th>Mas'ul</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={7}><div className="table-empty">Yuklanmoqda...</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty">Tranzaksiya topilmadi</div></td></tr>
              ) : filtered.map((t)=>(
                <tr key={t.id}>
                  <td style={{ fontWeight:500, color:'var(--text-muted)', fontSize:'0.8rem' }}>TRX-{t.id}</td>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>{new Date(t.createdAt).toLocaleString('uz-UZ')}</td>
                  <td>
                    {t.type==='IN' ? (
                      <span className="badge badge-active" style={{ display:'inline-flex', gap:'0.2rem' }}>
                        <ArrowDownLeft size={11}/> Kirim
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ display:'inline-flex', gap:'0.2rem' }}>
                        <ArrowUpRight size={11}/> Chiqim
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight:500 }}>{t.product?.name}</td>
                  <td style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>{t.reason || '-'}</td>
                  <td style={{ textAlign:'right', fontWeight:700, color: t.type==='IN'?'var(--success)':'var(--danger)' }}>
                    {t.type==='IN'?'+':'-'}{t.quantity} ta
                  </td>
                  <td style={{ fontSize:'0.8125rem' }}>{t.user?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yangi Kirim Modali */}
      {showInModal && (
        <div className="modal-overlay" onClick={() => setShowInModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yangi kirim qo'shish</h2>
              <button onClick={() => setShowInModal(false)} className="btn btn-ghost btn-icon"><X size={20}/></button>
            </div>
            <form onSubmit={handleNewIn}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Mahsulot <span style={{ color:'var(--danger)' }}>*</span></label>
                  <select
                    className="input-field"
                    value={inForm.productId}
                    onChange={e => setInForm(f => ({ ...f, productId: e.target.value }))}
                    required
                  >
                    <option value="">Mahsulot tanlang...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Qoldiq: {p.stock} {p.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Miqdor <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input
                    type="number"
                    className="input-field"
                    min="1"
                    required
                    placeholder="0"
                    value={inForm.quantity}
                    onChange={e => setInForm(f => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sabab / Izoh</label>
                  <input
                    className="input-field"
                    placeholder="Masalan: Yetkazuvchidan qabul qilindi"
                    value={inForm.reason}
                    onChange={e => setInForm(f => ({ ...f, reason: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowInModal(false)} className="btn btn-outline">Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={inSaving}>
                  {inSaving ? 'Saqlanmoqda...' : '💾 Kirimni saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
