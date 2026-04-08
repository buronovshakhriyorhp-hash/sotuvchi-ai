import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/axios';
import useToast from '../../store/useToast';

export default function WarehouseManager() {
  const toast = useToast();
  const [warehouses, setWarehouses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', isActive: true });
  const [error, setError] = useState('');

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      const list = Array.isArray(res) ? res : (res?.warehouses || res?.data || []);
      setWarehouses(list);
    } catch (err) {
      console.error('WarehouseManager fetch error:', err);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError("Ombor nomi majburiy!"); return; }
    try {
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, form);
      } else {
        await api.post('/warehouses', form);
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', address: '', isActive: true });
      fetchWarehouses();
    } catch (err) {
      setError(typeof err === 'string' ? err : (err?.message || 'Xatolik yuz berdi'));
    }
  };

  const handleEdit = (w) => {
    setEditing(w);
    setForm({ name: w.name, address: w.address || '', isActive: w.isActive });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Haqiqatan ham ushbu omborni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/warehouses/${id}`);
      fetchWarehouses();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : "O'chirishda xato");
    }
  };


  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Omborlar boshqaruvi</h1>
          <p className="page-subtitle">Tizimdagi barcha omborlarni boshqarish va yangilarini qo'shish</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', address: '', isActive: true }); setModalOpen(true); }}>
          <Plus size={18}/> Yangi ombor qo'shish
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>Yuklanmoqda...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.25rem' }}>
          {warehouses.map(w => (
            <div key={w.id} className="card shadow-sm" style={{ borderLeft: `4px solid ${w.isActive ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div className="icon-box" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                    <Building2 size={20}/>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'1.05rem' }}>{w.name}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.2rem' }}>
                      <MapPin size={12}/> {w.address || 'Manzil ko\'rsatilmagan'}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'0.25rem' }}>
                  <button className="btn-icon" onClick={() => handleEdit(w)} title="Tahrirlash"><Edit2 size={14}/></button>
                  <button className="btn-icon danger" onClick={() => handleDelete(w.id)} title="O'chirish"><Trash2 size={14}/></button>
                </div>
              </div>
              
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'1rem', borderTop:'1px solid var(--border)', fontSize:'0.85rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', color: w.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                  {w.isActive ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}
                  {w.isActive ? 'Faol' : 'Nofaol'}
                </div>
                <div style={{ color:'var(--text-muted)' }}>
                  {w._count?.stocks || 0} turdagi mahsulot
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Omborni tahrirlash' : "Yangi ombor qo'shish"}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}><XCircle size={18}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: 'var(--danger-bg)', border: '1px solid #fca5a5', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  ⚠️ {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Ombor nomi <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="input-field"
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Masalan: Markaziy ombor..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Manzil</label>
                <input
                  className="input-field"
                  type="text"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Masalan: Toshkent sh., Chilonzor..."
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div
                  onClick={() => setForm({...form, isActive: !form.isActive})}
                  style={{ width: 44, height: 24, borderRadius: 999, background: form.isActive ? 'var(--success)' : 'var(--border-strong)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: form.isActive ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
                </div>
                <label style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: form.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                  {form.isActive ? '✓ Faol holatda' : 'Nofaol'}
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">{editing ? '💾 Saqlash' : "➕ Qo'shish"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
