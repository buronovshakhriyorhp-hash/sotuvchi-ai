import React, { useState, useEffect } from 'react';
import { Search, Plus, Truck, PhoneCall, MapPin, ShoppingBag } from 'lucide-react';
import api from '../../api/axios';
import useCurrency from '../../store/useCurrency';
import useToast from '../../store/useToast';
import { Supplier } from '../../types';

export default function SupplierList() {
  const { format } = useCurrency();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const delay = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/suppliers', { params: { search } });
      const list = Array.isArray(res) ? res : (res?.suppliers || res?.data || []);
      setSuppliers(list);
    } catch (err) {
      console.error('SupplierList error:', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Yetkazib beruvchilar</h1>
          <p className="page-subtitle">{suppliers.length} ta hamkor</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => toast.info("Yetkazuvchi qo'shish modali tez orada qo'shiladi")} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><Plus size={16}/> Yangi qo'shish</button>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding:'1rem 1.25rem', marginBottom:'1.25rem' }}>
        <div className="search-input-wrap" style={{ maxWidth:'360px' }}>
          <Search size={15} className="input-icon"/>
          <input className="input-field" placeholder="Yetkazuvchi nomini qidirish..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:'2.5rem' }}/>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:'1rem' }}>
        {loading ? (
           <div className="card"><div className="empty-state"><span className="empty-state-title">Yuklanmoqda...</span></div></div>
        ) : suppliers.length === 0 ? (
          <div className="card"><div className="empty-state"><span className="empty-state-title">Yetkazuvchi topilmadi</span></div></div>
        ) : suppliers.map((s: Supplier)=>(
          <div key={s.id} className="card" style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem', borderLeft:`4px solid ${(s.debt || 0)>0?'var(--danger)':'var(--success)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'1.0625rem', color:'var(--text)' }}>{s.name}</div>
                <span className="badge badge-neutral" style={{ marginTop:'0.375rem' }}>{s.category || 'Umumiy'}</span>
              </div>
              <div style={{ background:'var(--surface-2)', borderRadius:'var(--radius)', padding:'0.625rem' }}>
                <Truck size={20} color="var(--primary-dark)"/>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', fontSize:'0.875rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-secondary)' }}>
                <PhoneCall size={14} color="var(--text-muted)"/>
                {s.phone ? <a href={`tel:${s.phone}`} style={{ textDecoration:'none', color:'var(--primary-dark)', fontWeight:500 }}>{s.phone}</a> : '-'}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-secondary)' }}>
                <MapPin size={14} color="var(--text-muted)"/>
                {s.region || s.address || '-'}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-secondary)' }}>
                <ShoppingBag size={14} color="var(--text-muted)"/>
                Ro'yxatdan o'tgan: {new Date(s.createdAt).toLocaleDateString('uz-UZ')}
              </div>
            </div>

            <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:500 }}>Qarz holati</div>
                <div style={{ fontWeight:700, color: (s.debt || 0)>0?'var(--danger)':'var(--success)', fontSize:'1rem' }}>
                  {(s.debt === 0 || !s.debt) ? '✓ Qarz yo\'q' : format(s.debt)}
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.375rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => toast.info(`"${s.name}" tahrirlash funksiyasi tez orada qo'shiladi`)}>Tahrirlash</button>
                <button className="btn btn-sm" style={{ background:'var(--info-bg)', color:'var(--info)', border:'none' }} onClick={() => toast.info(`"${s.name}" to'lov tarixi tez orada qo'shiladi`)}>Tarix</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
