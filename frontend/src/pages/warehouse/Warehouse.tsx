import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowDownLeft, ArrowUpRight, AlertTriangle, X, Upload, History, HelpCircle } from 'lucide-react';
import api from '../../api/axios';
import useToast from '../../store/useToast';
import { Product, WarehouseTransaction } from '../../types';
import ImportWizard from './components/ImportWizard';
import StockAudit from './components/StockAudit';
import QuickHelp from './components/QuickHelp';

interface StockStats {
  productsCount: number;
  lowStock: Product[];
  totalValue: number;
}

export default function Warehouse() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [stockStats, setStockStats] = useState<StockStats>({ productsCount: 0, lowStock: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [showInModal, setShowInModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [inForm, setInForm] = useState({ productId: '', quantity: '', reason: '' });
  const [products, setProducts] = useState<Product[]>([]);
  const [inSaving, setInSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, stockRes, prodRes, whRes] = await Promise.all([
        api.get('/warehouses/transactions', { params: { type: typeFilter === 'all' ? undefined : typeFilter, limit: 100 } }) as Promise<any>,
        api.get('/warehouses/stock').catch(() => null) as Promise<any>,
        api.get('/products', { params: { status: 'active', limit: 1000 } }).catch(() => []) as Promise<any>,
        api.get('/warehouses').catch(() => []) as Promise<any>
      ]);
      
      const txList = txRes?.txs || txRes?.data?.txs || [];
      setTransactions(txList);
      
      const stockData = stockRes || [];
      setStockStats({
        productsCount: stockData.length || 0,
        lowStock: stockData.filter((s: any) => s.quantity <= (s.product.minStock || 5)).map((s: any) => s.product),
        totalValue: stockData.reduce((acc: number, s: any) => acc + (s.quantity * (s.product.costPrice || 0)), 0),
      });

      const prodList = prodRes?.products || prodRes || [];
      setProducts(prodList);
      
      const whList = whRes?.data || whRes || [];
      setWarehouses(Array.isArray(whList) ? whList : []);
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

  const handleNewIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inForm.productId) return toast.error('Mahsulot tanlang!');
    if (!inForm.quantity || Number(inForm.quantity) <= 0) return toast.error('Miqdor musbat bo\'lishi kerak!');
    setInSaving(true);
    try {
      await api.post('/warehouses/transaction', {
        productId: Number(inForm.productId),
        warehouseId: warehouses[0]?.id,
        quantity: Number(inForm.quantity),
        type: 'IN',
        reason: inForm.reason || 'Yangi kirim'
      });
      toast.success('Kirim muvaffaqiyatli qayd etildi!');
      setShowInModal(false);
      setInForm({ productId: '', quantity: '', reason: '' });
      fetchData();
    } catch (err) {
      toast.error('Kirim qo\'shib bo\'lmadi');
    } finally {
      setInSaving(false);
    }
  };

  const filtered = transactions.filter(t => {
    const matchSearch = String(t.id).toLowerCase().includes(search.toLowerCase()) || 
                        (t.product?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalIn  = transactions.filter(t=>t.type==='IN' || t.type === 'ADJUST_IN').reduce((a,b)=>a+b.quantity,0);
  const totalOut = transactions.filter(t=>t.type==='OUT' || t.type === 'ADJUST_OUT').reduce((a,b)=>a+b.quantity,0);

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Omborlar va Logistika</h1>
            <p className="page-subtitle">Zaxiralar va mahsulotlar harakati nazorati</p>
          </div>
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={() => setShowHelp(true)} 
            style={{ marginTop: '-1rem', color: 'var(--primary)', animation: 'pulse 2s infinite' }}
            title="Qo'llanmani ko'rish"
          >
            <HelpCircle size={24} />
          </button>
        </div>
        <div className="page-actions" style={{ gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setShowImportModal(true)} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <Upload size={16}/> Ommaviy Import
          </button>
          <button className="btn btn-outline" onClick={() => setShowAuditModal(true)} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <History size={16}/> Inventarizatsiya
          </button>
          <button className="btn btn-primary" onClick={() => setShowInModal(true)} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <Plus size={16}/> Yangi kirim
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
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
                    {(t.type==='IN' || t.type === 'ADJUST_IN') ? (
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
                  <td style={{ textAlign:'right', fontWeight:700, color: (t.type==='IN' || t.type==='ADJUST_IN')?'var(--success)':'var(--danger)' }}>
                    {(t.type==='IN' || t.type==='ADJUST_IN')?'+':'-'}{t.quantity} ta
                  </td>
                  <td style={{ fontSize:'0.8125rem' }}>{t.user?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInModal && (
        <div className="drawer-overlay" onClick={() => setShowInModal(false)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(to right, var(--surface), var(--primary-light))', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="modal-title">Yangi kirim qo'shish</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Omborga mahsulot qabul qilish jarayoni</p>
              </div>
              <button onClick={() => setShowInModal(false)} className="btn btn-ghost btn-icon" style={{ borderRadius: '50%' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleNewIn} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                <div style={{ background: 'var(--primary-light)', padding: '0.875rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ color: 'var(--primary-dark)' }}><AlertTriangle size={18} /></div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 500, lineHeight: 1.4 }}>
                    Mahsulot miqdorini kiritganingizda, tizim avtomatik ravishda umumiy qoldiqni yangilaydi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-muted)' }}>Mahsulotni tanlang <span style={{ color:'var(--danger)' }}>*</span></label>
                    <select
                      className="input-field"
                      style={{ height: '48px', fontSize: '0.9375rem', fontWeight: 500 }}
                      value={inForm.productId}
                      onChange={e => setInForm(f => ({ ...f, productId: e.target.value }))}
                      required
                    >
                      <option value="">Qidirish yoki tanlash...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — (Hozirgi qoldiq: {p.stock} {p.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-muted)' }}>Mavjud miqdorga qo'shiladi <span style={{ color:'var(--danger)' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="input-field"
                        style={{ height: '48px', fontSize: '1.125rem', fontWeight: 700, paddingRight: '3rem' }}
                        min="1"
                        required
                        placeholder="0"
                        value={inForm.quantity}
                        onChange={e => setInForm(f => ({ ...f, quantity: e.target.value }))}
                      />
                      <span style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>TA</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-muted)' }}>Qo'shimcha izoh yoki sabab</label>
                    <textarea
                      className="input-field"
                      style={{ minHeight: '120px', resize: 'none', fontSize: '0.9375rem', lineHeight: 1.5, padding: '0.875rem' }}
                      placeholder="Masalan: Yangi partiya yetkazib berildi yoki xato tuzatildi..."
                      value={inForm.reason}
                      onChange={e => setInForm(f => ({ ...f, reason: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem', boxShadow: '0 -4px 12px rgba(0,0,0,0.03)' }}>
                <button type="button" onClick={() => setShowInModal(false)} className="btn btn-outline" style={{ height: '48px', flex: 1, borderRadius: 'var(--radius-lg)' }}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={inSaving} style={{ height: '48px', flex: 2, borderRadius: 'var(--radius-lg)', fontSize: '0.9375rem' }}>
                  {inSaving ? 'Saqlanmoqda...' : '💾 Kirimni saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHelp && <QuickHelp onClose={() => setShowHelp(false)} />}

      {showImportModal && (
        <ImportWizard 
          warehouses={warehouses}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => { fetchData(); setShowImportModal(false); }}
        />
      )}

      {showAuditModal && (
        <StockAudit 
          warehouseId={warehouses[0]?.id}
          warehouseName={warehouses[0]?.name || 'Asosiy ombor'}
          onClose={() => setShowAuditModal(false)}
          onSuccess={() => { fetchData(); setShowAuditModal(false); }}
        />
      )}
    </div>
  );
}
