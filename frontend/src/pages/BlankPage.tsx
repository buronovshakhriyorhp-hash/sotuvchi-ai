import React from 'react';

export default function BlankPage() {
  return (
    <div className="fade-in" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center', maxWidth:'400px' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--surface-2)', border:'2px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
          </svg>
        </div>
        <h2 style={{ fontSize:'1.375rem', fontWeight:700, color:'var(--text)', marginBottom:'0.5rem' }}>
          Tez orada tayyor bo'ladi
        </h2>
        <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', lineHeight:1.6 }}>
          Bu bo'lim hozirda ishlab chiqilmoqda. Tizimimiz jadal rivojlantirilmoqda, tez orada to'liq ishga tushiriladi.
        </p>
        <button onClick={() => window.history.back()} className="btn btn-outline" style={{ marginTop:'1.5rem' }}>
          ← Orqaga qaytish
        </button>
      </div>
    </div>
  );
}
