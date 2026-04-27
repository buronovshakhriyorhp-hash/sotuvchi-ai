import React, { useState } from 'react';
import { Trash2, ImageIcon, Edit2, Check, X as XIcon, AlertTriangle } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  sku: string;
  sellPrice: number;
  originalSellPrice?: number; // audit: egaga ko'rinishi uchun
  qty: number;
  stock: number;
  unit: string;
  minStock: number;
  costPrice?: number;
}

interface POSSelectedItemsProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  updateQty: (id: number, delta: number) => void;
  updatePrice: (id: number, newPrice: number) => void;
  removeFromCart: (id: number) => void;
  format: (val: number) => string;
}

// Float o'lchov birliklarini aniqlash
const isFloatUnit = (unit: string): boolean => {
  return ['kg', 'g', 'gr', 'gramm', 'litr', 'l', 'ml', 'sm', 'cm', 'm', 'ton'].includes((unit || '').toLowerCase());
};

const POSSelectedItems: React.FC<POSSelectedItemsProps> = ({
  cart, updateQty, updatePrice, removeFromCart, format
}) => {
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue]  = useState<string>('');

  const startPriceEdit = (item: CartItem) => {
    setEditingPriceId(item.id);
    setEditPriceValue(String(item.sellPrice));
  };

  const confirmPriceEdit = (item: CartItem) => {
    const newPrice = parseFloat(editPriceValue);
    if (!isNaN(newPrice) && newPrice > 0) {
      updatePrice(item.id, newPrice);
    }
    setEditingPriceId(null);
  };

  const cancelPriceEdit = () => {
    setEditingPriceId(null);
    setEditPriceValue('');
  };

  const zeroQtyCount = (cart || []).filter(i => (i.qty || 0) === 0).length;

  return (
    <div
      className="pos-selected-items fade-in"
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--surface-2)', borderRadius: '24px',
        border: '1px solid var(--border)', overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontWeight: 800,
      }}>
        <span>Mijoz xaridlari</span>
        {zeroQtyCount > 0 && (
          <span style={{
            fontSize: '0.7rem', color: 'var(--text-muted)',
            background: 'var(--surface-2)', padding: '2px 8px',
            borderRadius: '99px', border: '1px solid var(--border)',
          }}>
            {zeroQtyCount} ta → nol
          </span>
        )}
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {(!cart || cart.length === 0) ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Hozircha mahsulot tanlanmagan
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cart.map(item => {
              const isPriceEdited = item.originalSellPrice != null && Math.abs(item.sellPrice - item.originalSellPrice) > 0.01;
              const isBelowCost   = item.costPrice != null && item.sellPrice < item.costPrice;
              const isZeroQty     = item.qty === 0;
              const step          = isFloatUnit(item.unit) ? 0.001 : 1;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'var(--surface)', padding: '0.75rem', borderRadius: '16px',
                    border: `1px solid ${
                      isBelowCost  ? 'rgba(239,68,68,0.4)' :
                      isPriceEdited ? 'rgba(245,158,11,0.35)' :
                      'var(--border)'
                    }`,
                    boxShadow: 'var(--shadow-sm)',
                    opacity: isZeroQty ? 0.5 : 1,
                    transition: 'opacity 0.2s, border-color 0.2s',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'var(--surface-2)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ImageIcon size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>

                  {/* Name + Price area */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      title={item.name}
                      style={{
                        fontWeight: 700, fontSize: '0.875rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>

                    {/* Price row */}
                    {editingPriceId === item.id ? (
                      /* ─── Narx tahrirlash rejimi ─── */
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <input
                          id={`price-edit-${item.id}`}
                          type="number"
                          value={editPriceValue}
                          min="0.01"
                          step="any"
                          autoFocus
                          onChange={e => setEditPriceValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') confirmPriceEdit(item);
                            if (e.key === 'Escape') cancelPriceEdit();
                          }}
                          style={{
                            width: '86px', padding: '3px 6px',
                            fontSize: '0.8rem', fontWeight: 700,
                            border: '1.5px solid var(--primary)', borderRadius: '6px',
                            background: 'var(--surface)', color: 'var(--text)', outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => confirmPriceEdit(item)}
                          title="Tasdiqlash (Enter)"
                          style={{
                            background: 'var(--success-bg)', color: 'var(--success)',
                            border: 'none', borderRadius: '6px', width: '24px', height: '24px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={cancelPriceEdit}
                          title="Bekor qilish (Esc)"
                          style={{
                            background: 'var(--danger-bg)', color: 'var(--danger)',
                            border: 'none', borderRadius: '6px', width: '24px', height: '24px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <XIcon size={13} />
                        </button>
                      </div>
                    ) : (
                      /* ─── Narxni ko'rsatish + tahrirlash tugmasi ─── */
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {isBelowCost && (
                          <AlertTriangle size={11} color="var(--danger)" />
                        )}
                        <span style={{
                          fontSize: '0.75rem', fontWeight: isPriceEdited ? 700 : 400,
                          color: isBelowCost ? 'var(--danger)' : isPriceEdited ? 'var(--warning)' : 'var(--text-muted)',
                        }}>
                          {format(item.sellPrice)}
                        </span>
                        {isPriceEdited && item.originalSellPrice != null && (
                          <span style={{
                            fontSize: '0.68rem', color: 'var(--text-muted)',
                            textDecoration: 'line-through', opacity: 0.7,
                          }}>
                            {format(item.originalSellPrice)}
                          </span>
                        )}
                        {/* Narxni o'zgartirish tugmasi — egaga ko'rinadi */}
                        <button
                          onClick={() => startPriceEdit(item)}
                          title="Narxni o'zgartirish (sotuv logida egaga ko'rinadi)"
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '2px', borderRadius: '4px',
                            display: 'flex', alignItems: 'center',
                            opacity: 0.55, transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
                        >
                          <Edit2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Qty Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    <input
                      type="number"
                      value={item.qty}
                      min={0}
                      max={item.stock}
                      step={step}
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '' || raw === '-') return; // typing in progress
                        // Float support: parseFloat, not parseInt
                        let val = parseFloat(raw);
                        if (isNaN(val) || val < 0) val = 0;
                        if (val > item.stock) val = item.stock;
                        const delta = parseFloat((val - item.qty).toFixed(6));
                        if (Math.abs(delta) > 1e-9) updateQty(item.id, delta);
                      }}
                      onBlur={e => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) val = 0;
                        if (val > item.stock) val = item.stock;
                        const delta = parseFloat((val - item.qty).toFixed(6));
                        if (Math.abs(delta) > 1e-9) updateQty(item.id, delta);
                        // Qty=0 bo'lsa ham o'CHIRMAYMIZ — foydalanuvchi o'zi "Trash" bosadi
                      }}
                      style={{
                        width: '64px',
                        padding: '0.4rem 0.25rem',
                        border: `1px solid ${isZeroQty ? 'var(--danger)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        background: 'var(--surface-2)',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '0.9375rem',
                        color: isZeroQty ? 'var(--danger)' : 'var(--text)',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      title={`Mavjud: ${item.stock} ${item.unit}`}
                    />
                    <button
                      onClick={() => removeFromCart(item.id)}
                      title="O'chirish"
                      style={{
                        background: 'var(--danger-bg)', color: 'var(--danger)',
                        border: 'none', borderRadius: '10px', width: '36px', height: '36px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: '0.25rem',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem', borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Jami mahsulot:</div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>
            {(cart || []).reduce((s, i) => parseFloat((s + (i.qty || 0)).toFixed(4)), 0)} dona
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Jami summa:</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
            {format((cart || []).reduce((s, i) => s + ((i.sellPrice || 0) * (i.qty || 0)), 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSSelectedItems;
