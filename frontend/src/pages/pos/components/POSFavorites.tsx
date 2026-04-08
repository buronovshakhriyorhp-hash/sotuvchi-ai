import React from 'react';
import { Star } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  sellPrice: number;
  stock: number;
  unit: string;
  minStock: number;
}


interface POSFavoritesProps {
  topProducts: Product[];
  addToCart: (p: Product) => void;
  format: (val: number) => string;
}

const POSFavorites: React.FC<POSFavoritesProps> = ({ topProducts, addToCart, format }) => {
  if (!topProducts || topProducts.length === 0) return null;

  return (
    <div className="pos-favorites-container">
      <div className="pos-favorites-header">
        <Star size={14} className="text-primary" fill="var(--primary)" />
        <span>TEZKOR TANLASH</span>
      </div>
      <div className="pos-favorites-list">
        {topProducts.slice(0, 10).map((product) => (
          <button
            key={product.id}
            className="pos-favorite-chip"
            onClick={() => addToCart(product)}
            title={`${product.name} - ${format(product.sellPrice)}`}
          >
            <span className="name">{product.name}</span>
            <span className="price">{format(product.sellPrice)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default POSFavorites;
