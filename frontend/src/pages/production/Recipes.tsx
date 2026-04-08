import React, { useState } from 'react';
import { Layers, Plus, ChevronRight, Check } from 'lucide-react';

const DUMMY_RECIPES = [
  { id: 'RCP-1', name: 'Cotton T-Shirt Oq', finalProduct: 'T-Shirt Cotton Basic', estimatedCost: 3.20, time: '30 daqiqa' },
  { id: 'RCP-2', name: 'Denim Jeans Premium', finalProduct: 'Denim Jeans Blue', estimatedCost: 12.50, time: '2 soat' },
];

export default function Recipes() {
  return (
    <div className="fade-in">
      <div className="page-title-box">
        <h1 className="page-title">Mahsulot Retseptlari</h1>
        <button className="btn btn-primary bg-primary border-none">
          <Plus size={18} />
          Yangi Retsept Formulaviy Yaratish
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {DUMMY_RECIPES.map((r) => (
          <div key={r.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div className="flex justify-between items-center">
                 <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{r.name}</h2>
                 <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>{r.id}</span>
             </div>
             
             <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span style={{ display: 'block', marginBottom: '0.25rem' }}>Yakuniy maxsulot:</span>
                <span style={{ fontWeight: 500, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <Check size={16} /> {r.finalProduct}
                </span>
             </div>
             
             <div className="flex items-center justify-between" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ishlab chiqarish vaqti: </span>
                  <strong>{r.time}</strong>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534' }}>
                  ${r.estimatedCost.toFixed(2)}
                </div>
             </div>
             
             <button className="btn w-full" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', marginTop: '0.5rem' }}>
                Tarkibni yig'ish <ChevronRight size={16}/>
             </button>
          </div>
        ))}
      </div>
    </div>
  );
}
