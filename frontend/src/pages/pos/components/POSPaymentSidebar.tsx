import React from 'react';
import { UserPlus, MessageSquare, Banknote, CreditCard, Building2, ShoppingCart, LayoutGrid } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';

const METHODS = [
  { id:'mixed', label:'Aralash',    icon: LayoutGrid,  color:'var(--primary)' },
  { id:'debt',  label:'Qarzga',     icon: ShoppingCart,color:'#ef4444' },
];

interface POSPaymentSidebarProps {
  warehouses: any[];
  selectedWarehouseId: string;
  setSelectedWarehouseId: (id: string) => void;
  customers: any[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  setShowAddCustomer: (val: boolean) => void;
  discount: number;
  setDiscount: (val: number) => void;
  discountType: 'percent' | 'amount';
  setDiscountType: (val: 'percent' | 'amount') => void;
  method: string;
  setMethod: (val: string) => void;
  amounts: { cash: number; card: number; bank: number; debt: number };
  setAmounts: React.Dispatch<React.SetStateAction<{ cash: number; card: number; bank: number; debt: number }>>;
  note: string;
  setNote: (val: string) => void;
  cart: any[];
  loading: boolean;
  handleSell: () => void;
  subtotal: number;
  discountAmt: number;
  total: number;
  format: (amount: number) => string;
  searchRef?: React.RefObject<HTMLInputElement | null>;
}

const POSPaymentSidebar = ({ 
  warehouses, selectedWarehouseId, setSelectedWarehouseId,
  customers, selectedCustomerId, setSelectedCustomerId, setShowAddCustomer,
  method, setMethod, amounts, setAmounts,
  cart, loading, handleSell,
  total, format,
  searchRef
}: POSPaymentSidebarProps) => {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', padding: '1rem' }}>
      {/* Total Section */}
      <div style={{ 
        padding:'1.5rem', 
        background: 'var(--surface-2)', 
        borderRadius: '20px', 
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-premium)'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>To'lanishi kerak:</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
          {format(total)}
        </div>
      </div>

      {/* Warehouse & Customer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginLeft: '0.25rem' }}>Ombor</label>
          <select 
            disabled 
            value={selectedWarehouseId} 
            className="input-field" 
            style={{ height: '42px', fontSize: '0.875rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginLeft: '0.25rem' }}>Mijoz</label>
            <button 
              onClick={() => setShowAddCustomer(true)}
              className="btn btn-ghost btn-sm" 
              style={{ color:'var(--primary)', padding:0, height:'auto', fontSize:'0.7rem', gap:'0.25rem' }}
            ><UserPlus size={12}/> Qo'shish</button>
          </div>
          <SearchableSelect
            options={customers as any}
            value={selectedCustomerId}
            onChange={(val: any) => setSelectedCustomerId(val)}
            placeholder="Mijoz..."
            labelKey="name"
            valueKey="id"
            renderOption={(c: any) => (
              <div style={{ display:'flex', flexDirection:'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</span>
                {c.phone && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.phone}</span>}
              </div>
            )}
            className="pos-customer-select"
          />
        </div>
      </div>

      {/* Payment methods */}
      <div>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginLeft: '0.25rem', marginBottom: '0.5rem', display: 'block' }}>To'lov usuli</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          {METHODS.map(m => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem',
                  padding:'0.875rem 0.5rem', borderRadius: '14px',
                  border:`2px solid ${active ? m.color : 'var(--border)'}`,
                  background: active ? 'var(--primary-light)' : 'var(--surface)',
                  cursor:'pointer', transition:'all 0.2s', color: active ? 'var(--primary-dark)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={20} color={active ? m.color : 'var(--text-muted)'} />
                <span style={{ fontSize:'0.75rem', fontWeight:800 }}>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Amount Inputs (Only for Mixed) */}
        {method === 'mixed' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', background:'var(--surface-2)', padding:'1rem', borderRadius:'12px', border:'1px solid var(--border)', marginTop: '0.75rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', width:'40px', fontWeight: 600 }}>Naqd</span>
              <input 
                type="number" 
                className="input-field" 
                style={{ height:'36px', fontSize:'0.9rem', flex:1, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} 
                value={amounts.cash || ''}
                placeholder="0"
                onChange={e => setAmounts(p => ({ ...p, cash: Number(e.target.value) }))}
              />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', width:'40px', fontWeight: 600 }}>Karta</span>
              <input 
                type="number" 
                className="input-field" 
                style={{ height:'36px', fontSize:'0.9rem', flex:1, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} 
                value={amounts.card || ''}
                placeholder="0"
                onChange={e => setAmounts(p => ({ ...p, card: Number(e.target.value) }))}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '0.75rem', marginTop:'auto' }}>
        <button
          onClick={() => searchRef?.current?.focus()}
          className="btn btn-outline btn-lg"
          style={{ height: '56px', borderRadius: '16px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 700, position:'relative' }}
        >
          Tahrirlash
        </button>
        <button
          onClick={handleSell}
          disabled={cart.length === 0 || loading}
          className="btn btn-primary btn-lg"
          style={{ height: '56px', borderRadius: '16px', fontSize: '1rem', fontWeight: 900, boxShadow: 'var(--shadow-lg)', position:'relative', overflow:'visible' }}
        >
          {loading ? '...' : (
            <div style={{ display:'flex', flexDirection:'column', lineHeight:1.1, alignItems:'center' }}>
              <span>SOTUVNI YAKUNLASH</span>
              <span style={{ fontSize:'0.65rem', opacity:0.7, fontWeight:600, marginTop:4, background:'rgba(0,0,0,0.1)', padding:'2px 6px', borderRadius:4 }}>[F1] BOSING</span>
            </div>
          )}
        </button>
      </div>

    </div>
  );
};

export default POSPaymentSidebar;
