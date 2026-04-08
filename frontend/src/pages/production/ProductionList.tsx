import React, { useState } from 'react';
import { Play, CheckCircle2, RotateCcw } from 'lucide-react';

const DUMMY_PRODUCTIONS = [
  { id: 'PRD-101', recipe: 'Cotton T-Shirt Oq', planQty: 50, doneQty: 50, status: 'completed', date: '04-04-2026' },
  { id: 'PRD-102', recipe: 'Denim Jeans Premium', planQty: 100, doneQty: 40, status: 'in_progress', date: '04-04-2026' },
  { id: 'PRD-103', recipe: 'Running Sneakers Pro', planQty: 200, doneQty: 0, status: 'planned', date: '05-04-2026' },
];

export default function ProductionList() {
  return (
    <div className="fade-in">
      <div className="page-title-box">
        <h1 className="page-title">Ishlab chiqarilganlar bo'limi</h1>
        <button className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Play size={16} /> Yangi ishlab chiqarishni boshlash
        </button>
      </div>

      <div className="card">
         <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Jarayon ID</th>
                <th>Sana</th>
                <th>Ishlatilgan Retsept</th>
                <th>Rejalashtirilgan</th>
                <th>Bajarilgan</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_PRODUCTIONS.map((prd) => (
                <tr key={prd.id}>
                  <td style={{ fontWeight: 600 }}>{prd.id}</td>
                  <td>{prd.date}</td>
                  <td style={{ color: 'var(--primary-dark)', fontWeight: 500 }}>{prd.recipe}</td>
                  <td>{prd.planQty} ta</td>
                  <td style={{ fontWeight: prd.doneQty > 0 ? 700 : 400 }}>{prd.doneQty} ta</td>
                  <td>
                     {prd.status === 'completed' && <span className="badge badge-active"><CheckCircle2 size={12} style={{display:'inline', marginRight:'4px'}}/> Tugallangan</span>}
                     {prd.status === 'in_progress' && <span className="badge" style={{backgroundColor:'#fef08a', color:'#854d0e'}}><RotateCcw size={12} style={{display:'inline', marginRight:'4px'}}/> Jarayonda</span>}
                     {prd.status === 'planned' && <span className="badge badge-inactive" style={{backgroundColor:'#e2e8f0', color:'#475569'}}>Rejalashtirilgan</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         </div>
      </div>
    </div>
  );
}
