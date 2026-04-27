import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit2, Trash2, Search, XCircle, Grid } from 'lucide-react';
import api from '../../api/axios';
import useToast from '../../store/useToast';
import { Category } from '../../types';

export default function CategoryList() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get<any>('/categories');
      const list = Array.isArray(res) ? res : (res?.categories || res?.data || []);
      setCategories(list);
    } catch (err) {
      console.error('CategoryList error:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Turkum nomi majburiy!'); return; }
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
      } else {
        await api.post('/categories', form);
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '' });
      fetchCategories();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Xatolik yuz berdi');
    }
  };

  const handleEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name });
    setModalOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Haqiqatan ham ushbu turkumni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : "O'chirishda xatolik. Turkumda mahsulotlar bo'lishi mumkin.");
    }
  };


  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Turkumlar boshqaruvi</h1>
          <p className="page-subtitle">Mahsulotlarni toifalar bo'yicha saralash va boshqarish</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '' }); setModalOpen(true); }}>
          <Plus size={18}/> Yangi turkum qo'shish
        </button>
      </div>

      <div className="card shadow-sm" style={{ marginBottom:'1.5rem', padding:'1rem' }}>
        <div className="input-with-icon" style={{ maxWidth:'350px' }}>
          <Search size={16} className="input-icon" />
          <input 
            className="input-field" 
            placeholder="Turkum nomi bo'yicha qidirish..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft:'2.5rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>Yuklanmoqda...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1.25rem' }}>
          {filtered.length > 0 ? filtered.map(c => (
            <div key={c.id} className="card shadow-sm" style={{ transition:'transform 0.2s', cursor:'default' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div className="icon-box" style={{ background:'var(--secondary-light)', color:'var(--secondary)' }}>
                    <Grid size={20}/>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'1.05rem' }}>{c.name}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{(c as any)._count?.products || 0} ta mahsulot</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'0.25rem' }}>
                  <button className="btn-icon" onClick={() => handleEdit(c)} title="Tahrirlash"><Edit2 size={14}/></button>
                  <button className="btn-icon danger" onClick={() => handleDelete(c.id)} title="O'chirish"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          )) : (
            <div className="card" style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
              Hech qanday turkum topilmadi
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{ maxWidth:'440px', width:'100%', background:'var(--surface)', borderRadius:'var(--radius-xl)', boxShadow:'var(--shadow-xl)', overflow:'hidden', animation:'fadeUp 0.25s cubic-bezier(0.4,0,0.2,1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Turkumni tahrirlash' : "Yangi turkum qo'shish"}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}><XCircle size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding:'1.5rem' }}>
              {error && <div style={{ background:'var(--danger-bg)', border:'1px solid #fca5a5', color:'var(--danger)', padding:'0.75rem 1rem', borderRadius:'var(--radius)', marginBottom:'1rem', fontSize:'0.875rem' }}>⚠️ {error}</div>}
              <div className="form-group">
                <label className="form-label">Turkum nomi <span style={{ color:'var(--danger)' }}>*</span></label>
                <input
                  className="input-field"
                  type="text"
                  required
                  autoFocus
                  value={form.name}
                  onChange={e => setForm({ name: e.target.value })}
                  placeholder="Masalan: Poyabzallar..."
                />
              </div>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
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
