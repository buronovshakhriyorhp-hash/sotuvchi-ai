import React, { useState } from 'react';
import { X, DollarSign, FileText } from 'lucide-react';
import api from '../api/axios';
import useToast from '../store/useToast';
import useCurrency from '../store/useCurrency';

interface Props {
  debt: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DebtPaymentModal({ debt, onClose, onSuccess }: Props) {
  const toast = useToast();
  const { format } = useCurrency();
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // remaining qarz miqdori (to'g'ri yaxlitlash)
  const remaining = typeof debt.remaining !== 'undefined' ? debt.remaining : Math.round((debt.amount - debt.paidAmount) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error("To'g'ri summa kiriting");
    if (amount > remaining) return toast.error(`Maksimal to'lov miqdori: ${format(remaining)}`);

    setLoading(true);
    try {
      await api.post(`/debts/${debt.id}/pay`, { amount, note });
      toast.success("To'lov muvaffaqiyatli qabul qilindi");
      onSuccess();
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content fade-in" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 450, width: '100%' }}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Qarz to'lovi</h2>
            <p style={{ margin:0, marginTop:'0.25rem', fontSize:'0.8125rem', color:'var(--text-muted)' }}>
              Qolgan qarz: <strong style={{ color:'var(--danger)', fontSize: '0.9rem' }}>{format(remaining)}</strong>
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', justifyContent: 'space-between' }}>
                 <span>To'lov summasi</span>
                 <button type="button" className="btn btn-sm btn-outline" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', height: '1.75rem' }} onClick={() => setAmount(remaining)}>To'liq yopish</button>
              </label>
              <div className="search-input-wrap">
                <span className="input-icon" style={{ color:'var(--text-muted)', fontWeight:700 }}>UZS</span>
                <input 
                  type="number" className="input-field" 
                  value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} 
                  required min="0.01" step="any" max={remaining}
                  style={{ paddingLeft:'3.5rem', fontWeight:800, fontSize:'1.2rem', color: amount ? 'var(--success)' : 'inherit', height:'48px' }} 
                  placeholder="0"
                />
              </div>
              {amount !== '' && Number(amount) > 0 && <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Tushum miqdori: {format(Number(amount))} tasdiqlanmoqda</div>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><FileText size={16}/> Izoh qo'shish (ixtiyoriy)</label>
              <textarea 
                className="input-field" 
                value={note} onChange={e => setNote(e.target.value)} 
                placeholder="To'lov haqida qo'shimcha ma'lumot (ixtiyoriy)..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--surface)' }}>
            <button type="button" className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary" style={{ flex:1.5 }} disabled={loading || !amount || amount > remaining}>
              {loading ? "Kuting..." : "To'lovni Tasdiqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
