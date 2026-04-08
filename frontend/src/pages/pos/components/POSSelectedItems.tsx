import React from 'react';
import { Trash2, ImageIcon } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  sku: string;
  sellPrice: number;
  qty: number;
  stock: number;
  unit: string;
  minStock: number;
}

interface POSSelectedItemsProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  updateQty: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  format: (val: number) => string;
}

const POSSelectedItems: React.FC<POSSelectedItemsProps> = ({ cart, updateQty, removeFromCart, format }) => {
  return (
    <div className="pos-selected-items fade-in" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--surface-2)', borderRadius: '24px',
      border: '1px solid var(--border)', overflow: 'hidden'
    }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 800 }}>
        Mijoz xaridlari
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {cart.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Hozircha mahsulot tanlanmagan
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--surface)', padding: '0.75rem', borderRadius: '16px',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <ImageIcon size={20} className="text-muted" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {format(item.sellPrice)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    value={item.qty === 0 ? '' : item.qty}
                    min={1}
                    max={item.stock}
                    onChange={(e) => {
                      const newQty = e.target.value === '' ? 0 : parseInt(e.target.value);
                      if (!isNaN(newQty)) {
                         const delta = newQty - item.qty;
                         updateQty(item.id, delta);
                      }
                    }}
                    onBlur={(e) => {
                       let newQty = parseInt(e.target.value);
                       if (isNaN(newQty) || newQty < 1) newQty = 1;
                       const delta = newQty - item.qty;
                       if(delta !== 0) updateQty(item.id, delta);
                    }}
                    style={{
                      width: '50px', padding: '0.4rem', borderRadius: '8px',
                      border: '1px solid var(--border)', background: 'var(--surface-2)',
                      textAlign: 'center', fontWeight: 600, fontSize: '0.875rem',
                      color: 'var(--text)', outline: 'none'
                    }}
                  />
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    style={{ 
                      background: 'var(--danger-light)', color: 'var(--danger)', 
                      border: 'none', borderRadius: '8px', padding: '0.4rem', 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Info showing total below the items list */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Jami mahsulot:</div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{cart.reduce((s, i) => s + i.qty, 0)} dona</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Jami summa:</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
            {format(cart.reduce((s, i) => s + (i.sellPrice * i.qty), 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSSelectedItems;
