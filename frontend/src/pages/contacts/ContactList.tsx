import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/axios';

export default function ContactList({ type = 'customer' }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchContacts = async () => {
    try {
      const endpoint = type === 'customer' ? '/customers' : '/suppliers';
      const res = await api.get(endpoint, { params: { limit: 1000 } });
      setContacts(res.customers || res || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { setTimeout(fetchContacts, 0); }, [type, fetchContacts]);

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">{type === 'customer' ? 'Mijozlar kontaktlari' : 'Yetkazuvchilar kontaktlari'}</h1>
          <p className="page-subtitle">Barcha bog'lanish ma'lumotlari bir joyda</p>
        </div>
      </div>

      <div className="card shadow-sm" style={{ marginBottom:'1.5rem', padding:'1rem' }}>
        <div className="input-with-icon" style={{ maxWidth:'350px' }}>
          <Search size={16} className="input-icon" />
          <input 
            className="input-field" 
            placeholder="Ism yoki telefon bo'yicha qidirish..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft:'2.5rem' }}
          />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem' }}>
        {loading ? <div className="card" style={{gridColumn:'1/-1', textAlign:'center', padding:'3rem'}}>Yuklanmoqda...</div> : 
          filtered.length > 0 ? filtered.map(c => (
          <div key={c.id} className="card shadow-sm" style={{ padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem' }}>
              <div className="icon-box" style={{ background:'var(--surface-2)', color:'var(--primary)' }}>
                <User size={20}/>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'1.1rem' }}>{c.name}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{type === 'customer' ? 'Mijoz' : 'Yetkazuvchi'}</div>
              </div>
            </div>
            
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', fontSize:'0.9rem' }}>
                <Phone size={14} color="var(--text-muted)"/>
                <span>{c.phone || 'Noma\'lum'}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', fontSize:'0.9rem' }}>
                <Mail size={14} color="var(--text-muted)"/>
                <span>{c.email || 'Noma\'lum'}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', fontSize:'0.9rem' }}>
                <MapPin size={14} color="var(--text-muted)"/>
                <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.address || 'Manzil ko\'rsatilmagan'}</span>
              </div>
            </div>

            <div style={{ borderTop:'1px solid var(--border)', marginTop:'1.25rem', paddingTop:'1rem', display:'flex', gap:'0.5rem' }}>
              <button className="btn btn-primary btn-sm" style={{ flex:1 }}>Yozish</button>
              <button className="btn btn-outline btn-sm" style={{ flex:1 }}>Qo'ng'iroq</button>
            </div>
          </div>
        )) : <div className="card" style={{gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>Hech qanday kontakt topilmadi</div>}
      </div>
    </div>
  );
}
