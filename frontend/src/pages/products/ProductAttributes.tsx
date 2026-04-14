/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Edit2, Trash2, Tag, ChevronRight, XCircle } from 'lucide-react';
import api from '../../api/axios';

interface AttributeValue {
  id: number | string;
  value: string;
  attributeId: number | string;
}

interface Attribute {
  id: number | string;
  name: string;
  values?: AttributeValue[];
}

export default function ProductAttributes() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [form, setForm] = useState({ name: '' });
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [error, setError] = useState('');
  const [valueForm, setValueForm] = useState({ value: '', attributeId: '' as string | number });
  
  const fetchData = async () => {
    try {
      // Backend routes for attributes might need to be created
      const res = await api.get<any>('/api/attributes');
      setAttributes(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAttrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAttr) await api.put(`/api/attributes/${editingAttr.id}`, form);
      else await api.post('/api/attributes', form);
      setModalOpen(false);
      fetchData();
    } catch (err: any) { setError(err.response?.data?.error || 'Xatolik'); }
  };

  const handleValueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingValue) await api.put(`/api/attributes/values/${editingValue.id}`, valueForm);
      else await api.post('/api/attributes/values', valueForm);
      setValueModalOpen(false);
      fetchData();
    } catch (err: any) { setError(err.response?.data?.error || 'Xatolik'); }
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
                {attr.values?.map((val: AttributeValue) => (
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
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth:'450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingAttr ? 'Atributni tahrirlash' : 'Yangi atribut'}</h2>
              <button className="modal-close" onClick={()=>setModalOpen(false)}><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleAttrSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Atribut nomi (masalan: Rangi)</label>
                  <input className="input-field" required value={form.name} onChange={e=>setForm({name:e.target.value})} placeholder="Nomini kiriting..."/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Value Modal */}
      {valueModalOpen && (
        <div className="modal-overlay" onClick={() => setValueModalOpen(false)}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth:'450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Qiymat qo'shish</h2>
              <button className="modal-close" onClick={()=>setValueModalOpen(false)}><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleValueSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Qiymat (masalan: Qizil, XL)</label>
                  <input className="input-field" required value={valueForm.value} onChange={e=>setValueForm({...valueForm, value:e.target.value})} placeholder="Qiymatni kiriting..."/>
                </div>
              </div>
              <div className="modal-footer">
                 <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setValueModalOpen(false)}>Bekor qilish</button>
                 <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}    </div>
  );
}
