import React, { useState, useEffect } from 'react';
import { Plus, Search, Clock, CheckCircle2, Truck, AlertCircle, Eye, Edit2 } from 'lucide-react';
import api from '../../api/axios';
import useCurrency from '../../store/useCurrency';
import useToast from '../../store/useToast';

const STATUS_MAP = {
  new:       { label:'Yangi',        badge:'badge-info',    icon: AlertCircle   },
  ready:     { label:'Tayyor',       badge:'badge-warning', icon: CheckCircle2  },
  delivered: { label:'Yetkazildi',   badge:'badge-active',  icon: Truck         },
  cancelled: { label:'Bekor qilingan',badge:'badge-danger', icon: Clock         },
};

const KANBAN_COLS = ['new', 'ready', 'delivered'];

export default function OrderList() {
  const toast = useToast();
  const { format } = useCurrency();

  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res) ? res : (res?.orders || res?.data || []);
      setOrders(list);
    } catch (err) {
      console.error('OrderList error:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o =>
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.orderNo || '').toLowerCase().includes(search.toLowerCase())
  );

  const moveStatus = async (id, newStatus) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      toast.success("Buyurtma holati yangilandi");
    } catch {
      toast.error("Xatolik: Status o'zgarmadi");
      fetchOrders(); // rollback
    }
  };


  const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || STATUS_MAP.new;
    const Icon = s.icon;
    return <span className={`badge ${s.badge}`} style={{ display:'inline-flex', gap:'0.2rem', alignItems:'center' }}><Icon size={10}/>{s.label}</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Buyurtmalar ro'yxati</h1>
          <p className="page-subtitle">{orders.length} ta buyurtma</p>
        </div>
        <div className="page-actions">
          <div style={{ display:'flex', gap:'0.375rem', background:'var(--surface-2)', padding:'0.25rem', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
            <button onClick={()=>setView('table')} className={`btn btn-sm ${view==='table'?'btn-primary':'btn-ghost'}`} style={{ padding:'0.375rem 0.75rem' }}>Jadval</button>
            <button onClick={()=>setView('kanban')} className={`btn btn-sm ${view==='kanban'?'btn-primary':'btn-ghost'}`} style={{ padding:'0.375rem 0.75rem' }}>Kanban</button>
          </div>
          <button className="btn btn-primary" onClick={() => toast.info("Yangi buyurtma qo'shish kelgusida qo'shiladi")} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><Plus size={16}/> Yangi buyurtma</button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:'1.25rem' }}>
        {Object.entries(STATUS_MAP).map(([key, val]) => {
          const Icon = val.icon;
          const count = orders.filter(o=>o.status===key).length;
          return (
            <div key={key} className="card" style={{ padding:'1rem 1.25rem', cursor:'pointer' }} onClick={()=>{}}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div className="stat-label">{val.label}</div>
                  <div className="stat-value" style={{ fontSize:'2rem' }}>{count}</div>
                </div>
                <Icon size={24} color={key==='delivered'?'var(--success)':key==='cancelled'?'var(--danger)':key==='ready'?'var(--warning)':'var(--info)'} />
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
            <div className="search-input-wrap" style={{ maxWidth:'360px' }}>
              <Search size={15} className="input-icon"/>
              <input className="input-field" placeholder="Buyurtma yoki mijoz..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:'2.5rem' }}/>
            </div>
          </div>
          <div className="table-wrapper" style={{ border:'none', borderRadius:0 }}>
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Mijoz</th><th>Mahsulot</th><th style={{ textAlign:'right' }}>Summa</th><th>Sana</th><th>Muddat</th><th>Holat</th><th style={{ textAlign:'right' }}>Amal</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}><div className="table-empty">Yuklanmoqda...</div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="table-empty">Buyurtma topilmadi</div></td></tr>
                ) : filtered.map((o)=>(
                  <tr key={o.id}>
                    <td style={{ fontWeight:600, color:'var(--primary-dark)', fontSize:'0.8rem' }}>{o.orderNo}</td>
                    <td style={{ fontWeight:500 }}>{o.customerName}</td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>
                      {(() => {
                        let parsed = [];
                        try { parsed = JSON.parse(o.items); } catch(e){}
                        return parsed.map(i => i.name).join(', ') || '-';
                      })()}
                    </td>
                    <td style={{ textAlign:'right', fontWeight:700 }}>{format(o.amount || 0)}</td>
                    <td style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('uz-UZ')}</td>
                    <td style={{ fontSize:'0.8rem', color:o.status==='cancelled'?'var(--danger)':'var(--text-muted)', fontWeight:o.status==='cancelled'?700:400 }}>
                      {o.dueDate ? new Date(o.dueDate).toLocaleDateString('uz-UZ') : '-'}
                    </td>
                    <td><StatusBadge status={o.status}/></td>
                    <td style={{ textAlign:'right' }}>
                      <div style={{ display:'flex', gap:'0.25rem', justifyContent:'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => toast.info(`Buyurtma ${o.orderNo} tafsilotlari`)} title="Ko'rish"><Eye size={14}/></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => toast.info(`Buyurtma ${o.orderNo} tahrirlash`)} title="Tahrirlash"><Edit2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
          {KANBAN_COLS.map(col => {
            const colOrders = orders.filter(o => o.status === col);
            const S = STATUS_MAP[col];
            return (
              <div key={col}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                  <span className={`badge ${S.badge}`}>{S.label}</span>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600 }}>{colOrders.length} ta</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {colOrders.map((o)=>(
                    <div key={o.id} className="card" style={{ padding:'1rem', cursor:'grab' }}>
                      <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--primary-dark)', marginBottom:'0.375rem' }}>{o.orderNo}</div>
                      <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>{o.customerName}</div>
                      <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>
                         {(() => {
                            let parsed = [];
                            try { parsed = JSON.parse(o.items); } catch(e){}
                            return parsed.map(i => i.name).join(', ') || '-';
                          })()}
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontWeight:700, color:'var(--primary-dark)' }}>{(o.amount/1000).toFixed(0)}K so'm</span>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Muddat: {o.dueDate ? new Date(o.dueDate).toLocaleDateString('uz-UZ') : '-'}</span>
                      </div>
                      {col !== 'delivered' && (
                        <div style={{ display:'flex', gap:'0.375rem', marginTop:'0.75rem', borderTop:'1px solid var(--border)', paddingTop:'0.75rem' }}>
                          {col === 'new' && <button onClick={()=>moveStatus(o.id,'ready')} className="btn btn-warning btn-sm" style={{ flex:1, background:'#fef3c7', color:'#d97706', border:'none' }}>Tayyor ✓</button>}
                          {col === 'ready' && <button onClick={()=>moveStatus(o.id,'delivered')} className="btn btn-success btn-sm" style={{ flex:1 }}>Yetkazildi ✓</button>}
                        </div>
                      )}
                    </div>
                  ))}
                  {colOrders.length === 0 && (
                    <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.875rem', border:'2px dashed var(--border)', borderRadius:'var(--radius)' }}>
                      Bo'sh
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
