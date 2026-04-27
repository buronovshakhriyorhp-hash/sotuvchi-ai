import React from 'react';
import { Search, SortAsc, ShoppingCart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  sellPrice: number;
  stock: number;
  unit: string;
  minStock: number;
}

interface Category {
  id: number;
  name: string;
}

interface POSProductGridProps {
  search: string;
  setSearch: (val: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  displayedProducts: Product[];
  addToCart: (p: Product) => void;
  format: (val: number) => string;
}

const POSProductGrid = ({ 
  search, setSearch, searchRef, 
  displayedProducts, addToCart, format
}: POSProductGridProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      {/* Search & Action Bar */}
      <div className="glass-panel" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        padding: '0.75rem',
        marginBottom: '0.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        display: 'flex',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
          <input
            ref={searchRef}
            className="input-field"
            placeholder="Mahsulot nomi, SKU yoki Shtrix-kod..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              paddingLeft: '3rem', 
              height: '52px', 
              fontSize: '1rem', 
              background: 'var(--surface-2)', 
              border: 'none',
              borderRadius: 'var(--radius)',
              width: '100%'
            }}
            autoComplete="off"
            autoFocus
          />
        </div>
        <button className="btn btn-primary btn-icon" style={{ width: '52px', height: '52px', borderRadius: 'var(--radius)' }}>
          <SortAsc size={24} />
        </button>
      </div>

      {/* Product Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem' }}>
        {(displayedProducts || []).length === 0 ? (
          <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
            <div style={{ padding: '2rem', background: 'var(--surface-2)', borderRadius: '50%', width: 'fit-content', margin: '0 auto 2rem' }}>
              <Search size={48} style={{ opacity: 0.2, color: 'var(--text-muted)' }} />
            </div>
            <div style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 800 }}>Mahsulot topilmadi</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Boshqa kalit so'z bilan qidirib ko'ring</div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
            gap: '1rem' 
          }}>
            {(displayedProducts || []).map(p => {
              const outOfStock = (p?.stock || 0) <= 0;
              const lowStock = (p?.stock || 0) < (p?.minStock || 5);
              
              return (
                <div 
                  key={p?.id} 
                  className="card product-tile" 
                  onClick={() => !outOfStock && addToCart(p)}
                  style={{ 
                    padding: '0.75rem', 
                    cursor: outOfStock ? 'not-allowed' : 'pointer', 
                    border: '1px solid var(--border)', 
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                    opacity: outOfStock ? 0.6 : 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.75rem',
                    minHeight: '180px', 
                    background: 'var(--surface)',
                    boxShadow: 'var(--shadow-sm)',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative'
                  }}
                >
                  {/* Label/Badge */}
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                     <span style={{ 
                       padding: '0.25rem 0.5rem', 
                       borderRadius: '6px', 
                       fontSize: '0.65rem', 
                       fontWeight: 800,
                       background: outOfStock ? 'var(--danger-bg)' : lowStock ? 'var(--warning-bg)' : 'var(--success-bg)',
                       color: outOfStock ? 'var(--danger)' : lowStock ? 'var(--warning-strong)' : 'var(--success)'
                     }}>
                       {outOfStock ? 'Tugagan' : `${p?.stock || 0} ${p?.unit || ''}`}
                     </span>
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ 
                      fontWeight: 800, 
                      fontSize: '0.9375rem', 
                      color: 'var(--text)', 
                      lineHeight: 1.2,
                      minHeight: '2.4em',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                    }}>{p?.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'monospace' }}>#{p?.sku}</div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>NARXI</div>
                    <div style={{ fontWeight: 900, color: 'var(--primary-deep)', fontSize: '1.25rem' }}>{format(p?.sellPrice || 0)}</div>
                  </div>

                  <div className="product-tile-overlay" style={{ 
                    position: 'absolute', 
                    bottom: '0.75rem', 
                    right: '0.75rem',
                    background: 'var(--primary)',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    scale: '0',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-lg)'
                  }}>
                    <ShoppingCart size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default POSProductGrid;
