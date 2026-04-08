import React, { useState } from 'react';
import { Search, Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import useCurrency from '../../store/useCurrency';
import useToast from '../../store/useToast';

const DEBTS = [
  { id:'SD-001', supplier:'Textile Pro LLC',     amount:4500000, due:'2026-04-08', status:'overdue', note:'Xomashyo uchun' },
  { id:'SD-002', supplier:'Mega Bo\'yoq',        amount:0,       due:'2026-03-30', status:'paid',    note:'To\'liq to\'landi' },
  { id:'SD-003', supplier:'Global Charm Export', amount:480000,  due:'2026-04-15', status:'pending', note:'Qisman to\'lov kutilmoqda' },
];

export default function SupplierDebts() {
  const { format } = useCurrency();
  const toast = useToast();
  const [debts, setDebts] = useState(DEBTS);

  const markPaid = (id) => setDebts(prev => prev.map(d => d.id===id ? { ...d, status:'paid', amount:0 } : d));

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Yetkazuvchilar qarzi</h1>
          <p className="page-subtitle">To'lanishi kerak bo'lgan qarzlar</p>
        </div>
        <button className="btn btn-primary" onClick={() => toast.info("Yangi qarz qo'shish modali tez orada qo'shiladi")} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><Plus size={16}/> Yangi qarz</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'1.25rem' }}>
        {[
          { label:'Jami qarz',    value: format(debts.filter(d=>d.status!=='paid').reduce((s,d)=>s+d.amount,0)), color:'var(--danger)' },
          { label:"Muddati o'tgan", value: debts.filter(d=>d.status==='overdue').length + ' ta', color:'var(--warning)' },
          { label:"To'langan",    value: debts.filter(d=>d.status==='paid').length + ' ta', color:'var(--success)' },
        ].map((s,i) => (
          <div key={i} className="card" style={{ padding:'1rem 1.5rem' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize:'1.375rem', color:s.color, marginTop:'0.375rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrapper" style={{ border:'none', borderRadius:0 }}>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Yetkazuvchi</th><th>Izoh</th><th>Muddat</th><th style={{ textAlign:'right' }}>Summa</th><th>Holat</th><th style={{ textAlign:'right' }}>Amal</th></tr>
            </thead>
            <tbody>
              {debts.map((d,i) => (
                <tr key={i} style={{ opacity: d.status==='paid'?0.6:1 }}>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{d.id}</td>
                  <td style={{ fontWeight:600 }}>{d.supplier}</td>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>{d.note}</td>
                  <td style={{ color: d.status==='overdue'?'var(--danger)':'var(--text-muted)', fontWeight: d.status==='overdue'?700:400, fontSize:'0.8125rem' }}>{d.due}</td>
                  <td style={{ textAlign:'right', fontWeight:700, color: d.status==='paid'?'var(--text-muted)':'var(--danger)' }}>
                    {d.status==='paid' ? '—' : format(d.amount)}
                  </td>
                  <td>
                    {d.status==='paid' && <span className="badge badge-active"><CheckCircle2 size={10}/> To'landi</span>}
                    {d.status==='overdue' && <span className="badge badge-danger"><AlertCircle size={10}/> Muddati o'tgan</span>}
                    {d.status==='pending' && <span className="badge badge-warning"><Clock size={10}/> Kutmoqda</span>}
                  </td>
                  <td style={{ textAlign:'right' }}>
                    {d.status!=='paid' && (
                      <button onClick={() => markPaid(d.id)} className="btn btn-success btn-sm">
                        <CheckCircle2 size={13}/> To'landi
                      </button>
                    )}
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
