import React, { useState, useEffect } from 'react';
import { Search, Plus, PhoneCall, MoreVertical, TrendingDown, TrendingUp, Minus, X, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import useCurrency from '../../store/useCurrency';
import useToast from '../../store/useToast';
import { Customer } from '../../types';

export default function CustomerList() {
  const { format } = useCurrency();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', type: 'individual' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const delay = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(delay);
  }, [search]);

  // Tashqi click'da menyuni yopish
  useEffect(() => {
    const handler = () => setMenuOpenId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/customers', { params: { search } });
      const list = Array.isArray(res) ? res : (res?.customers || res?.data || []);
      setCustomers(list);
    } catch (err) {
      console.error('CustomerList error:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Mijoz ismi majburiy!');
    setSaving(true);
    try {
      const res = await api.post('/customers', formData);
      toast.success("Mijoz muvaffaqiyatli qo'shildi");
      setCustomers(prev => [...prev, res]);
      setShowAddModal(false);
      setFormData({ name: '', phone: '', address: '', type: 'individual' });
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : "Mijoz qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Mijozni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success("Mijoz o'chirildi");
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Xatolik yuz berdi');
    }
  };

  const debtCount = customers.filter(c => (c.balance || 0) < 0).length;
  const clearCount = customers.filter(c => (c.balance || 0) >= 0).length;

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Mijozlar bazasi</h1>
          <p className="page-subtitle">{customers.length} ta mijoz</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <Plus size={16}/> Yangi mijoz
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'1.25rem' }}>
        {[
          { label:'Jami mijozlar',     value: customers.length + ' ta',            color:'var(--text)' },
          { label:'Qarzdor mijozlar',  value: debtCount + ' ta',  color:'var(--danger)' },
          { label:"To'liq hisoblashgan", value: clearCount + ' ta', color:'var(--success)' },
        ].map((s,i)=>(
          <div key={i} className="card" style={{ padding:'1rem 1.5rem' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize:'1.75rem', color:s.color, marginTop:'0.375rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <div className="search-input-wrap" style={{ maxWidth:'360px' }}>
            <Search size={15} className="input-icon" />
            <input className="input-field" placeholder="Ism yoki telefon raqam bo'yicha qidirish..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:'2.5rem' }} />
          </div>
        </div>

        <div className="table-wrapper" style={{ border:'none', borderRadius:0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mijoz</th>
                <th>Telefon</th>
                <th>Hudud</th>
                <th>Turi</th>
                <th style={{ textAlign:'right' }}>Buyurtmalar</th>
                <th style={{ textAlign:'right' }}>Balans</th>
                <th style={{ textAlign:'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="table-empty">Yuklanmoqda...</div></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8}><div className="table-empty">Mijoz topilmadi</div></td></tr>
              ) : customers.map((c)=>(
                <tr key={c.id}>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>M-{c.id}</td>
                  <td style={{ fontWeight:600 }}>{c.name}</td>
                  <td>
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} style={{ display:'flex', alignItems:'center', gap:'0.375rem', color:'var(--primary-dark)', fontWeight:500, textDecoration:'none', fontSize:'0.875rem' }}>
                        <PhoneCall size={13}/> {c.phone}
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{ color:'var(--text-muted)' }}>{c.region || '-'}</td>
                  <td>
                    <span className={`badge ${c.type==='company'?'badge-info':'badge-neutral'}`}>
                      {c.type === 'company' ? 'Yuridik' : 'Jismoniy'}
                    </span>
                  </td>
                  <td style={{ textAlign:'right', fontWeight:600 }}>{c.totalOrders || 0} ta</td>
                  <td style={{ textAlign:'right', fontWeight:700 }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', color: (c.balance || 0) < 0 ? 'var(--danger)' : (c.balance || 0) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {(c.balance || 0) < 0 ? <TrendingDown size={14}/> : (c.balance || 0) > 0 ? <TrendingUp size={14}/> : <Minus size={14}/>}
                      {c.balance === 0 || !c.balance ? 'Teng' : format(Math.abs(c.balance))}
                    </span>
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <div style={{ position:'relative', display:'inline-block' }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                      >
                        <MoreVertical size={15}/>
                      </button>
                      {menuOpenId === c.id && (
                        <div style={{
                          position:'absolute', right:0, top:'100%', zIndex:100,
                          background:'var(--surface)', border:'1px solid var(--border)',
                          borderRadius:'var(--radius)', boxShadow:'var(--shadow-md)',
                          minWidth:'140px', padding:'0.25rem 0'
                        }}>
                          <button
                            onClick={() => { toast.info("Tahrirlash funksiyasi kelgusida qo'shiladi"); setMenuOpenId(null); }}
                            style={{ width:'100%', padding:'0.5rem 1rem', background:'none', border:'none', textAlign:'left', cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-main)' }}
                          >
                            <Edit2 size={13}/> Tahrirlash
                          </button>
                          <button
                            onClick={() => { handleDelete(c.id); setMenuOpenId(null); }}
                            style={{ width:'100%', padding:'0.5rem 1rem', background:'none', border:'none', textAlign:'left', cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--danger)' }}
                          >
                            <Trash2 size={13}/> O'chirish
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yangi mijoz qo'shish</h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-icon"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Mijoz ismi <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input className="input-field" required placeholder="Masalan: Azizbek Karimov" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon raqami</label>
                  <input className="input-field" placeholder="+998 90 123 45 67" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Manzil</label>
                  <input className="input-field" placeholder="Toshkent sh., Yunusobod" value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Turi</label>
                  <select className="input-field" value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}>
                    <option value="individual">Jismoniy shaxs</option>
                    <option value="company">Yuridik shaxs</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : "💾 Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
