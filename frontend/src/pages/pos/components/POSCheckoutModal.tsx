import React from 'react';
import { X, UserPlus, FileText, CreditCard, Banknote, Landmark, CircleDollarSign } from 'lucide-react';

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

  // Handle amount change for mixed payment
  const handleAmountChange = (key: string, val: string) => {
    const num = val === '' ? 0 : parseFloat(val);
    props.setAmounts({ ...amounts, [key]: isNaN(num) ? 0 : num });
  };

  const paymentMethods = [
    { id: 'cash', label: 'Naqd', icon: Banknote },
    { id: 'card', label: 'Karta', icon: CreditCard },
    { id: 'bank', label: 'Bank', icon: Landmark },
    { id: 'debt', label: 'Qarzga', icon: CircleDollarSign },
    { id: 'mixed', label: 'Aralash', icon: Banknote }, // Custom icon
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)', zIndex: 1000}}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
        maxWidth: '600px', width: '90%', borderRadius: '24px', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Mijoz to'lovi</h2>
          <button onClick={onClose} className="btn-icon btn-ghost" style={{ background: 'var(--surface-2)' }}><X size={20}/></button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto', background: 'var(--surface)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Ombor */}
            <div>
              <label className="form-label">Ombor <span className="text-danger">*</span></label>
              <select className="input-field" value={selectedWarehouseId} onChange={e => setSelectedWarehouseId(e.target.value)}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            
            {/* Mijoz */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Mijoz {method === 'debt' && <span className="text-danger">*</span>}</label>
                <button type="button" className="btn-link" onClick={() => setShowAddCustomer(true)} style={{ padding: 0, fontSize: '0.875rem' }}>
                  <UserPlus size={14}/> Qo'shish
                </button>
              </div>
              <select className="input-field" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                <option value="">Chakana mijoz (Tanlanmagan)</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>To'lanishi kerak:</span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{format(total)}</span>
             </div>
             
             {/* Discount Row */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Chegirma turi</label>
                  <select className="input-field" value={discountType} onChange={(e: any) => setDiscountType(e.target.value)} style={{ padding: '0.5rem' }}>
                    <option value="percent">Foiz (%)</option>
                    <option value="amount">Summa</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Chegirma miqdori</label>
                  <input 
                    type="number" className="input-field" 
                    value={discount === 0 ? '' : discount} 
                    onChange={e => setDiscount(Number(e.target.value) || 0)} 
                    style={{ padding: '0.5rem' }}
                    placeholder="0"
                  />
                </div>
             </div>
          </div>

          {/* Payment Methods */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">To'lov usuli</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {paymentMethods.map(pm => {
                const Icon = pm.icon;
                const active = method === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '12px',
                      border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'var(--primary-light)' : 'var(--surface)',
                      color: active ? 'var(--primary-dark)' : 'var(--text-muted)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                      cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.75rem'
                    }}
                  >
                    <Icon size={20} />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mixed Payment Inputs */}
          {method === 'mixed' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--surface-2)', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label text-sm">Naqd</label>
                <input type="number" className="input-field" value={amounts.cash || ''} onChange={e => handleAmountChange('cash', e.target.value)} />
              </div>
              <div>
                <label className="form-label text-sm">Karta</label>
                <input type="number" className="input-field" value={amounts.card || ''} onChange={e => handleAmountChange('card', e.target.value)} />
              </div>
              <div>
                <label className="form-label text-sm">Bank</label>
                <input type="number" className="input-field" value={amounts.bank || ''} onChange={e => handleAmountChange('bank', e.target.value)} />
              </div>
              <div>
                <label className="form-label text-sm">Qarzga</label>
                <input type="number" className="input-field" value={amounts.debt || ''} onChange={e => handleAmountChange('debt', e.target.value)} />
              </div>
            </div>
          )}

          {/* Izoh (Comment) Field */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={16}/> Izoh</label>
            <textarea 
              className="input-field" 
              placeholder="Qo'shimcha ma'lumot qoldiring (ixtiyoriy)..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              style={{ padding: '0.75rem', borderRadius: '12px', resize: 'none' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: '1rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, padding: '1rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}>
            Bekor qilish
          </button>
          <button 
            onClick={() => {
              handleSell();
              // handleSell sets success to true in usePOS if successful. 
              // We could close this modal, but let POS.tsx handle it when success becomes true.
              onClose();
            }} 
            className="btn btn-primary" 
            style={{ flex: 1, padding: '1rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', background: 'var(--primary)', color: 'var(--primary-deep)', boxShadow: '0 4px 14px 0 var(--primary)' }}
          >
            Sotuvni yakunlash
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSCheckoutModal;
