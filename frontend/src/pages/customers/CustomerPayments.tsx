import React, { useState } from 'react';
import { Search, CreditCard, CheckCircle2, Clock, Plus } from 'lucide-react';
import useCurrency from '../../store/useCurrency.js';
import useToast from '../../store/useToast';

const PAYMENTS = [
  { id:'P-001', customer:'Aliyev Vali',    amount:145500,  date:'04.04.2026 14:30', method:'Karta', note:'Avvalgi qarzni to\'ladi' },
  { id:'P-002', customer:'Zarina R.',      amount:120000,  date:'04.04.2026 16:15', method:'Naqd',  note:'Joriy to\'lov' },
  { id:'P-003', customer:'Qurilish MChJ',  amount:1000000, date:'03.04.2026 11:00', method:'Bank',  note:'Qisman to\'lov' },
  { id:'P-004', customer:'Mega Store LLC', amount:500000,  date:'02.04.2026 09:30', method:'Karta', note:'Avans to\'lov' },
];

const total = PAYMENTS.reduce((s, p) => s + p.amount, 0);

export default function CustomerPayments() {
  const { format } = useCurrency();
  const toast = useToast();
  const [search, setSearch] = useState('');

  const filtered = PAYMENTS.filter(p =>
    p.customer.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Mijozlar to'lovlari</h1>
          <p className="page-subtitle">Jami qabul: <strong style={{ color:'var(--success)' }}>{format(total)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => toast.info("To'lov qabul qilish modali tez orada qo'shiladi")} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><Plus size={16}/> To'lov qabul qilish</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'1.25rem' }}>
        {[
          { label:"Bugungi to'lovlar", value: PAYMENTS.filter(p=>p.date.startsWith('04.04')).length + ' ta', color:'var(--primary-dark)' },
          { label:'Jami summa',        value: `${(total/1000000).toFixed(1)}M so'm`, color:'var(--success)' },
          { label:"O'rtacha to'lov",   value: format(Math.round(total/PAYMENTS.length)), color:'var(--info)' },
        ].map((s,i) => (
          <div key={i} className="card" style={{ padding:'1rem 1.5rem' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize:'1.375rem', color:s.color, marginTop:'0.375rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <div className="search-input-wrap" style={{ maxWidth:'360px' }}>
            <Search size={15} className="input-icon"/>
            <input className="input-field" placeholder="Mijoz yoki ID bo'yicha qidirish..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:'2.5rem' }}/>
          </div>
        </div>
        <div className="table-wrapper" style={{ border:'none', borderRadius:0 }}>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Mijoz</th><th>To'lov usuli</th><th>Izoh</th><th style={{ textAlign:'right' }}>Summa</th><th>Sana</th></tr>
            </thead>
            <tbody>
              {filtered.map((p,i) => (
                <tr key={i}>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{p.id}</td>
                  <td style={{ fontWeight:600 }}>{p.customer}</td>
                  <td>
                    <span className={`badge ${p.method==='Karta'?'badge-info':p.method==='Bank'?'badge-neutral':'badge-active'}`}>
                      <CreditCard size={10}/> {p.method}
                    </span>
                  </td>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>{p.note}</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'var(--success)' }}>+{format(p.amount)}</td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
