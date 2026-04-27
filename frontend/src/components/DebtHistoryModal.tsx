import React from 'react';
import { X, Calendar, DollarSign, FileText } from 'lucide-react';
import useCurrency from '../store/useCurrency';

interface Props {
  debt: any;
  onClose: () => void;
}

export default function DebtHistoryModal({ debt, onClose }: Props) {
  const { format } = useCurrency();

  const payments = debt?.payments || [];

  return (
    <div className="modal-overlay" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)', padding: '1rem'
    }} onClick={onClose}>
      <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '100%' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">To'lovlar tarixi va Izohlar</h2>
            <p style={{ margin:0, marginTop:'0.25rem', fontSize:'0.8125rem', color:'var(--text-muted)' }}>
              Umumiy qarz: <strong>{format(debt.amount)}</strong> | Qolgan: <strong style={{ color:'var(--danger)' }}>{format(debt.remaining)}</strong>
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {payments.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>
              Hali to'lovlar amalga oshirilmagan yoki izohlar mavjud emas.
            </div>
          ) : (
            payments.map((p: any, idx: number) => (
              <div key={idx} style={{ padding:'1rem', background:'var(--surface-2)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', color:'var(--text-muted)', fontSize:'0.8125rem', fontWeight:600 }}>
                    <Calendar size={14}/> {new Date(p.createdAt).toLocaleString('uz-UZ')}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.25rem', color:'var(--success)', fontWeight:800, fontSize:'1.1rem' }}>
                    <DollarSign size={16}/> {format(p.amount)}
                  </div>
                </div>
                {p.method && p.method !== 'cash' && p.method !== 'card' && p.method !== 'bank' && (
                  <div style={{ background:'var(--surface)', padding:'0.75rem', borderRadius:'var(--radius)', fontSize:'0.875rem', color:'var(--text)', borderLeft:'3px solid var(--primary-deep)', display:'flex', gap:'0.5rem', alignItems:'flex-start' }}>
                    <FileText size={16} style={{ color:'var(--primary)', flexShrink:0, marginTop:'0.125rem' }}/>
                    <div style={{ lineHeight:1.5 }}>{p.method}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
