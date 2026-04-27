import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Banknote, DollarSign } from 'lucide-react';
import api from '../api/axios';
import { Customer } from '../types';
import useToast from '../store/useToast';

interface PaymentModalProps {
  sale: {
    subtotal: number;
    payload: any;
    customerId: number | null;
  };
  customers: Customer[];
  onClose: () => void;
  onConfirmed: (sale: any, print: boolean) => void;
}

export default function PaymentModal({ sale, customers, onClose, onConfirmed }: PaymentModalProps) {
  const toast = useToast();
  const [method, setMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState(sale.subtotal.toString());
  const [cardAmount, setCardAmount] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState('percent');

  const [customerId, setCustomerId] = useState(sale.customerId ? String(sale.customerId) : '');
  const [loading, setLoading] = useState(false);

  const subtotal = sale.subtotal;

  const totalDiscountAmt = parseFloat(discount) || 0;
  let computedDiscount = 0;
  if (discountType === 'percent') {
    computedDiscount = (subtotal * totalDiscountAmt) / 100;
  } else {
    computedDiscount = totalDiscountAmt;
  }
  const toPay = Math.max(0, subtotal - computedDiscount);

  // Auto calculate remaining to Debt if method is mixed but doesn't add up
  const cAmt = parseFloat(cashAmount) || 0;
  const pAmt = parseFloat(cardAmount) || 0;
  const bAmt = parseFloat(bankAmount) || 0;
  const currSum = cAmt + pAmt + bAmt;

  const dAmt = Math.max(0, toPay - currSum);

  const handlePay = async (print: boolean) => {
    let finalDebt = 0;
    
    if (method === 'cash') finalDebt = Math.max(0, toPay - cAmt);
    else if (method === 'card') finalDebt = Math.max(0, toPay - (parseFloat(cardAmount) || 0));
    else if (method === 'bank') finalDebt = Math.max(0, toPay - (parseFloat(bankAmount) || 0));
    else if (method === 'debt') finalDebt = toPay;
    else finalDebt = dAmt;

    if (finalDebt > 0 && !customerId) {
        toast.warning("Qarzga yozish uchun mijoz tanlash majburiy!");
        return;
    }

    setLoading(true);
    try {
        const p = { ...sale.payload };
        p.customerId = customerId ? parseInt(customerId) : null;
        p.discount = parseFloat(discount) || 0;
        p.discountType = discountType;
        p.paymentMethod = method;

        if (method === 'cash') {
            p.cashAmount = cAmt; p.cardAmount = 0; p.bankAmount = 0; p.debtAmount = finalDebt;
        } else if (method === 'card') {
            p.cashAmount = 0; p.cardAmount = parseFloat(cardAmount) || 0; p.bankAmount = 0; p.debtAmount = finalDebt;
        } else if (method === 'bank') {
            p.cashAmount = 0; p.cardAmount = 0; p.bankAmount = parseFloat(bankAmount) || 0; p.debtAmount = finalDebt;
        } else if (method === 'debt') {
            p.cashAmount = 0; p.cardAmount = 0; p.bankAmount = 0; p.debtAmount = finalDebt;
        } else {
            p.cashAmount = cAmt; p.cardAmount = pAmt; p.bankAmount = bAmt; p.debtAmount = dAmt;
        }

        const res = await api.post('/sales', p);
        onConfirmed(res, print);
    } catch (err) {
        toast.error(typeof err === 'string' ? err : "To'lovni saqlashda xatolik");
    } finally {
        setLoading(false);
    }
  };

  const setFullAmount = (m: string) => {
    if (m === 'cash') setCashAmount(toPay.toString());
    else if (m === 'card') setCardAmount(toPay.toString());
    else if (m === 'bank') setBankAmount(toPay.toString());
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'transparent' }}>
      <div className="modal-content modal-md" onClick={e => e.stopPropagation()} style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
         <div className="modal-header">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>To'lovni tasdiqlash</h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
         </div>
         <div className="modal-body">
            
            <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                    <span style={{ color:'var(--text-muted)' }}>Jami summa:</span>
                    <span style={{ fontWeight:700 }}>{subtotal.toLocaleString()} UZS</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem', alignItems:'center' }}>
                    <span style={{ color:'var(--text-muted)' }}>Chegirma:</span>
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                        <input className="input-field" type="number" style={{ width:80, height:30 }} value={discount} onChange={e=>setDiscount(e.target.value)} />
                        <select className="navbar-select" style={{ height:30 }} value={discountType} onChange={e=>setDiscountType(e.target.value)}>
                            <option value="percent">%</option>
                            <option value="amount">Sum</option>
                        </select>
                    </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid var(--border)', paddingTop:'0.75rem', marginTop:'0.5rem' }}>
                    <span style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text)' }}>To'lanishi kerak:</span>
                    <span style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--danger)' }}>{toPay.toLocaleString()} UZS</span>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Mijozni biriktirish (Qarz uchun majburiy)</label>
                <select className="input-field" value={customerId} onChange={e=>setCustomerId(e.target.value)}>
                    <option value="">Chakana mijoz</option>
                    {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name} {c.phone}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">To'lov turi</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
                    <button onClick={()=>{setMethod('cash'); setFullAmount('cash');}} className={`btn ${method==='cash'?'btn-primary':'btn-outline'}`} style={{ padding:'0.75rem' }}><Banknote size={16}/> Naqd pul</button>
                    <button onClick={()=>{setMethod('card'); setFullAmount('card');}} className={`btn ${method==='card'?'btn-primary':'btn-outline'}`} style={{ padding:'0.75rem' }}><CreditCard size={16}/> Plastik karta</button>
                    <button onClick={()=>{setMethod('bank'); setFullAmount('bank');}} className={`btn ${method==='bank'?'btn-primary':'btn-outline'}`} style={{ padding:'0.75rem' }}><DollarSign size={16}/> Bank orqali</button>
                    <button onClick={()=>{setMethod('mixed'); setCashAmount(''); setCardAmount('');}} className={`btn ${method==='mixed'?'btn-primary':'btn-outline'}`} style={{ padding:'0.75rem' }}>Aralash / Qarz</button>
                </div>

                {method === 'cash' && <input type="number" className="input-field" placeholder="Kiritilgan summa" value={cashAmount} onChange={e=>setCashAmount(e.target.value)} />}
                {method === 'card' && <input type="number" className="input-field" placeholder="Karta orqali summa" value={cardAmount} onChange={e=>setCardAmount(e.target.value)} />}
                {method === 'bank' && <input type="number" className="input-field" placeholder="Bank orqali summa" value={bankAmount} onChange={e=>setBankAmount(e.target.value)} />}
                
                {method === 'mixed' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                        <div><label style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Naqd to'lov</label><input type="number" className="input-field" value={cashAmount} onChange={e=>setCashAmount(e.target.value)}/></div>
                        <div><label style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Plastik karta</label><input type="number" className="input-field" value={cardAmount} onChange={e=>setCardAmount(e.target.value)}/></div>
                        <div><label style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Bank</label><input type="number" className="input-field" value={bankAmount} onChange={e=>setBankAmount(e.target.value)}/></div>
                        <div style={{ background:'#fef2f2', padding:'0.75rem', borderRadius:'var(--radius)', color:'var(--danger)', fontWeight:700 }}>Qarzga: {dAmt.toLocaleString()}</div>
                    </div>
                )}
            </div>

         </div>
         <div className="modal-footer" style={{ display:'flex', gap:'1rem' }}>
             <button onClick={()=>handlePay(false)} disabled={loading} className="btn btn-outline" style={{ flex:1 }}>Saqlash</button>
             <button onClick={()=>handlePay(true)} disabled={loading} className="btn btn-primary" style={{ flex:2, fontSize:'1.05rem' }}>Tasdiqlash va Chek</button>
         </div>
      </div>
    </div>
  );
}
