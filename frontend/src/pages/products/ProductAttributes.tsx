/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Edit2, Trash2, Tag, ChevronRight, XCircle } from 'lucide-react';
import api from '../../api/axios';

export default function ProductAttributes() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
    const [editingAttr, setEditingAttr] = useState(null);
    const [form, setForm] = useState({ name: '' });
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [error, setError] = useState('');
  const [valueForm, setValueForm] = useState({ value: '', attributeId: '' });
  
  const fetchData = async () => {
    try {
      // Backend routes for attributes might need to be created
      const res = await api.get('/api/attributes');
      setAttributes(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAttrSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAttr) await api.put(`/api/attributes/${editingAttr.id}`, form);
      else await api.post('/api/attributes', form);
      setModalOpen(false);
      fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Xatolik'); }
  };

  const handleValueSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingValue) await api.put(`/api/attributes/values/${editingValue.id}`, valueForm);
      else await api.post('/api/attributes/values', valueForm);
      setValueModalOpen(false);
      fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Xatolik'); }
  };

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Mahsulot atributlari</h1>
          <p className="page-subtitle">Mahsulotlarning o'lchami, rangi va boshqa xususiyatlarini boshqarish</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingAttr(null); setForm({name:''}); setModalOpen(true); }}>
          <Plus size={18}/> Yangi atribut qo'shish
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>Yuklanmoqda...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))', gap:'1.5rem' }}>
          {attributes.map(attr => (
            <div key={attr.id} className="card shadow-sm">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div className="icon-box" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                    <Sliders size={18}/>
                  </div>
                  <div style={{ fontWeight:700, fontSize:'1.1rem' }}>{attr.name}</div>
                </div>
                <div style={{ display:'flex', gap:'0.25rem' }}>
                  <button className="btn-icon" onClick={() => { setEditingAttr(attr); setForm({name:attr.name}); setModalOpen(true); }}><Edit2 size={14}/></button>
                  <button className="btn-icon danger"><Trash2 size={14}/></button>
                </div>
              </div>

              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                {attr.values?.map(val => (
                  <div key={val.id} className="badge badge-neutral" style={{ padding:'0.4rem 0.75rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    {val.value}
                    <button style={{ border:'none', background:'none', padding:0, cursor:'pointer', color:'var(--text-muted)' }}>
                      <Trash2 size={10}/>
                    </button>
                  </div>
                ))}
                <button 
                  className="badge" 
                  style={{ border:'1px dashed var(--border)', background:'transparent', color:'var(--primary)', cursor:'pointer' }}
                  onClick={() => { setValueForm({ value:'', attributeId: attr.id }); setValueModalOpen(true); }}
                >
                  <Plus size={12}/> Qo'shish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attr Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth:'400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingAttr ? 'Atributni tahrirlash' : 'Yangi atribut'}</h2>
              <button className="btn-icon" onClick={()=>setModalOpen(false)}><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleAttrSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Atribut nomi (masalan: Rangi)</label>
                  <input className="input-field" required value={form.name} onChange={e=>setForm({name:e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
