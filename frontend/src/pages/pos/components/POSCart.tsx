import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle } from 'lucide-react';

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


interface POSCartProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  updateQty: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  format: (val: number) => string;
}

const POSCart: React.FC<POSCartProps> = ({ cart, setCart, updateQty, removeFromCart, format }) => {
  return (
    <div className="pos-cart-container">
      {cart.length === 0 ? (
        <div className="pos-cart-empty">
          <div className="empty-icon-wrapper">
            <ShoppingCart size={48} className="text-muted" strokeWidth={1} />
          </div>
          <h3>Savat bo'sh</h3>
          <p>Mahsulotlarni qidirishni yoki shtrix-kodni skanerlashni boshlang</p>
        </div>
      ) : (
        <div className="pos-cart-list">
          {cart.map((item) => (
            <div key={item.id} className="pos-cart-item">
              <div className="item-main">
                <div className="item-info">
                  <div className="item-name" title={item.name}>{item.name}</div>
                  <div className="item-sku">{item.sku}</div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)} 
                  className="btn-remove"
                  title="O'chirish"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="item-controls">
                <div className="qty-group">
                  <button 
                    disabled={item.qty <= 1}
                    onClick={() => updateQty(item.id, -1)}
                    className="qty-btn"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    className="qty-input"
                    value={item.qty}
                    readOnly
                  />
                  <button 
                    disabled={item.qty >= item.stock}
                    onClick={() => updateQty(item.id, 1)}
                    className="qty-btn"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="unit">{item.unit}</span>
                </div>

                <div className="price-info">
                  <span className="unit-price">{format(item.sellPrice)}</span>
                  <span className="total-price">{format(item.sellPrice * item.qty)}</span>
                </div>
              </div>
              
              {item.qty >= item.stock && (
                <div className="stock-warning">
                  <AlertCircle size={10} />
                  <span>Maksimal zaxira: {item.stock} {item.unit}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="pos-cart-actions">
          <button 
            onClick={() => {
              if (confirm("Savatni butunlay bo'shatmoqchimisiz?")) setCart([]);
            }}
            className="btn-clear-cart"
          >
            Savatni tozalash
          </button>
        </div>
      )}
    </div>
  );
};

export default POSCart;

