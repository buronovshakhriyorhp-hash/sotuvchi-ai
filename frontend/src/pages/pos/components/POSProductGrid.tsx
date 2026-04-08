import React from 'react';
import { Search, SortAsc } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
      {/* Search Section */}
      <div className="input-with-icon" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <Search size={22} className="input-icon" style={{ left: '1.25rem', color: 'var(--primary)' }} />
        <input
          ref={searchRef}
          className="input-field"
          placeholder="Mahsulot nomi yoki SKU bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ 
            paddingLeft:'3.5rem', 
            height:'64px', 
            fontSize: '1.125rem', 
            background: 'var(--surface)', 
            border: '2px solid var(--border)',
            borderRadius: '16px',
            color: 'var(--text)',
            boxShadow: 'var(--shadow-lg)'
          }}
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Product Grid */}
      <div style={{ flex:1, overflowY:'auto', paddingRight: '4px' }}>
        {displayedProducts.length === 0 ? (
          <div style={{ padding:'6rem 2rem', textAlign: 'center', background: 'var(--surface-2)', borderRadius: '24px', border: '2px dashed var(--border)', opacity: 0.8 }}>
            <Search size={64} style={{ opacity:0.1, margin: '0 auto 1.5rem', color: 'var(--text-muted)' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: '1.125rem', fontWeight: 600 }}>Mahsulot topilmadi</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1.25rem' }}>
            {displayedProducts.map(p => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock < p.minStock;
              
              return (
                <div 
                  key={p.id} 
                  className="card" 
                  onClick={() => !isOutOfStock && addToCart(p)}
                  style={{ 
                    padding:'1.25rem', 
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
                    border:'1px solid var(--border)', 
                    transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    opacity: isOutOfStock ? 0.4 : 1, 
                    filter: isOutOfStock ? 'grayscale(1)' : 'none',
                    display:'flex', flexDirection:'column', justifyContent:'space-between', 
                    minHeight:'160px', 
                    background: 'var(--surface)',
                    boxShadow: 'var(--shadow-md)',
                    borderRadius: '20px',
                    userSelect: 'none'
                  }}
                  onMouseEnter={e => { 
                    if (!isOutOfStock) {
                      e.currentTarget.style.borderColor='var(--primary)'; 
                      e.currentTarget.style.background='var(--surface-2)';
                      e.currentTarget.style.transform='translateY(-6px)'; 
                      e.currentTarget.style.boxShadow='var(--shadow-xl)';
                    }
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.borderColor='var(--border)'; 
                    e.currentTarget.style.background='var(--surface)';
                    e.currentTarget.style.transform='none'; 
                    e.currentTarget.style.boxShadow='var(--shadow-md)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight:700, fontSize:'1rem', color: 'var(--text)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--primary-dark)', background: 'var(--primary-light)', padding: '0.25rem 0.6rem', borderRadius: '8px', width: 'fit-content', fontWeight: 700, letterSpacing: '0.05em' }}>{p.sku}</div>
                  </div>
                  
                  <div style={{ marginTop:'1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom: '2px' }}>Narxi:</div>
                      <div style={{ fontWeight:800, color:'var(--primary)', fontSize:'1.25rem' }}>{format(p.sellPrice)}</div>
                    </div>
                    <div style={{ 
                      fontSize:'0.75rem', 
                      color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--success)', 
                      fontWeight: 700,
                      textAlign: 'right'
                    }}>
                      {isOutOfStock ? 'Yo\'q' : `${p.stock} ${p.unit}`}
                    </div>
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
