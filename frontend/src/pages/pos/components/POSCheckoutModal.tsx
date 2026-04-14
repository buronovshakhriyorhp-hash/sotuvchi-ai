import React from 'react';
import { X, UserPlus, FileText, CreditCard, Banknote, Landmark, CircleDollarSign, Activity } from 'lucide-react';

interface POSCheckoutModalProps {
  onClose: () => void;
  // from pos hook
  cart: any[];
  total: number;
  subtotal: number;
  discountAmt: number;
  discount: number;
  setDiscount: (v: number) => void;
  discountType: 'percent' | 'amount';
  setDiscountType: (v: 'percent' | 'amount') => void;
  method: string;
  setMethod: (v: string) => void;
  amounts: { cash: number; card: number; bank: number; debt: number };
  setAmounts: (v: any) => void;
  customers: any[];
  selectedCustomerId: string;
  setSelectedCustomerId: (v: string) => void;
  warehouses: any[];
  selectedWarehouseId: string;
  setSelectedWarehouseId: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  handleSell: () => void;
  setShowAddCustomer: (v: boolean) => void;
  format: (v: number) => string;
}

const POSCheckoutModal: React.FC<POSCheckoutModalProps> = (props) => {
  const { 
    onClose, total, subtotal, discount, setDiscount, discountType, setDiscountType, discountAmt,
    method, setMethod, amounts, setAmounts, customers, selectedCustomerId, setSelectedCustomerId,
    warehouses, selectedWarehouseId, setSelectedWarehouseId, note, setNote, handleSell, setShowAddCustomer, format
  } = props;

  // Qarz uchun mijoz majburiy tekshirish
  const hasDebtAmount = method === 'debt' || (method === 'mixed' && (amounts.debt || 0) > 0);
  const debtNeedsCustomer = hasDebtAmount && !selectedCustomerId;

  const handleAmountChange = (key: string, val: string) => {
    const num = val === '' ? 0 : parseFloat(val);
    props.setAmounts({ ...amounts, [key]: isNaN(num) ? 0 : num });
  };

  const paymentMethods = [
    { id: 'cash', label: 'Naqd', icon: Banknote, color: '#10b981' },
    { id: 'card', label: 'Karta', icon: CreditCard, color: '#3b82f6' },
    { id: 'bank', label: 'Bank', icon: Landmark, color: '#8b5cf6' },
    { id: 'debt', label: 'Qarz', icon: CircleDollarSign, color: '#ef4444' },
    { id: 'mixed', label: 'Aralash', icon: Activity, color: '#f59e0b' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(12px)', background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ 
        maxWidth: '650px', width: '95%', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        boxShadow: 'var(--shadow-2xl)', background: 'var(--surface)', border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>Sotuvni yakunlash</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>Barcha to'lov ma'lumotlarini tekshiring</p>
          </div>
          <button onClick={onClose} className="btn-icon btn-ghost" style={{ background: 'var(--surface-2)', borderRadius: '50%', width: '40px', height: '40px' }}><X size={20}/></button>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* Summary Banner */}
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary-deep) 0%, var(--primary-dark) 100%)', 
            padding: '2rem', 
            borderRadius: 'var(--radius-lg)', 
            marginBottom: '2rem', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 25px -5px rgba(180, 83, 9, 0.4)'
          }}>
             <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Umumiy summa:</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{format(total)}</div>
             </div>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8 }}>Chegirma:</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{format(discountAmt)}</div>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Selection Column */}
            <div className="space-y-4">
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Omborni tanlang</label>
                <select className="input-field" value={selectedWarehouseId} onChange={e => setSelectedWarehouseId(e.target.value)} style={{ padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Mijoz</label>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowAddCustomer(true)} style={{ color: 'var(--primary-dark)', padding: '0 0.5rem' }}>
                    <UserPlus size={14}/> Qo'shish
                  </button>
                </div>
                <select
                  className="input-field"
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  style={{
                    padding: '0.75rem', borderRadius: 'var(--radius)',
                    // Qarz tanlanganda mijoz tanlanmagan bo'lsa qizil border
                    border: debtNeedsCustomer ? '2px solid var(--danger)' : '1px solid var(--border)'
                  }}
                >
                  <option value="">Chakana mijoz</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {/* Qarz+Mijoz ogohlantirishi */}
                {debtNeedsCustomer && (
                  <div style={{
                    marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                    background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}>
                    ⚠️ Qarzga sotish uchun mijozni tanlang!
                  </div>
                )}
              </div>
            </div>

            {/* Discount Column */}
            <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Chegirma qo'shish</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                   <button 
                    onClick={() => setDiscountType('percent')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: discountType === 'percent' ? 'var(--primary)' : 'transparent', color: discountType === 'percent' ? 'var(--primary-deep)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                   >% Foiz</button>
                   <button 
                    onClick={() => setDiscountType('amount')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: discountType === 'amount' ? 'var(--primary)' : 'transparent', color: discountType === 'amount' ? 'var(--primary-deep)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                   >Summa</button>
                </div>
                <input 
                  type="number" className="input-field" 
                  value={discount === 0 ? '' : discount} 
                  onChange={e => setDiscount(Number(e.target.value) || 0)} 
                  style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 800, height: '48px' }}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: '1rem' }}>To'lov usulini tanlang</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
              {paymentMethods.map(pm => {
                const Icon = pm.icon;
                const active = method === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id)}
                    style={{
                      padding: '1rem 0.5rem',
                      borderRadius: 'var(--radius)',
                      border: `2px solid ${active ? pm.color : 'var(--border)'}`,
                      background: active ? `${pm.color}10` : 'var(--surface)',
                      color: active ? pm.color : 'var(--text-muted)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', fontWeight: 800, fontSize: '0.75rem'
                    }}
                  >
                    <Icon size={24} />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mixed Payment Details */}
          {method === 'mixed' && (
            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--surface-2)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', border: '1px solid var(--border-strong)' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>NAQD</label>
                <input type="number" className="input-field" value={amounts.cash || ''} onChange={e => handleAmountChange('cash', e.target.value)} style={{ fontWeight: 700 }} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>KARTA</label>
                <input type="number" className="input-field" value={amounts.card || ''} onChange={e => handleAmountChange('card', e.target.value)} style={{ fontWeight: 700 }} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>BANK</label>
                <input type="number" className="input-field" value={amounts.bank || ''} onChange={e => handleAmountChange('bank', e.target.value)} style={{ fontWeight: 700 }} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>QARZ</label>
                <input type="number" className="input-field" value={amounts.debt || ''} onChange={e => handleAmountChange('debt', e.target.value)} style={{ fontWeight: 700 }} />
              </div>
            </div>
          )}

          {/* Note Section */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18}/> Izoh qoldirish</label>
            <textarea 
              className="input-field" 
              placeholder="Sotuvga oid maxsus eslatmalar..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              style={{ padding: '1rem', borderRadius: 'var(--radius)', resize: 'none', background: 'var(--surface)' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: '1rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, padding: '1.25rem', fontSize: '1rem', fontWeight: 800, borderRadius: 'var(--radius)' }}>
            Bekor qilish
          </button>
          <button 
            onClick={() => { handleSell(); onClose(); }} 
            className="btn btn-primary" 
            disabled={debtNeedsCustomer}
            title={debtNeedsCustomer ? "Qarzga sotish uchun mijoz tanlang!" : ''}
            style={{ 
              flex: 1.5, 
              padding: '1.25rem', 
              fontSize: '1.125rem', 
              fontWeight: 900, 
              borderRadius: 'var(--radius)', 
              background: debtNeedsCustomer ? 'var(--border-strong)' : 'var(--primary)', 
              color: debtNeedsCustomer ? 'var(--text-muted)' : 'var(--primary-deep)',
              boxShadow: debtNeedsCustomer ? 'none' : '0 8px 16px -4px rgba(245, 158, 11, 0.5)',
              cursor: debtNeedsCustomer ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {debtNeedsCustomer ? '⚠️ Mijoz tanlang!' : "To'lovni tasdiqlash"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSCheckoutModal;
