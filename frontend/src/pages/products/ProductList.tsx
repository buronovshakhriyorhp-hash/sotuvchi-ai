import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, Eye, Image } from 'lucide-react';
import { productService } from '@/services/product.service';
import { Product } from '@/types';
import AddProductModal from '@/components/AddProductModal';
import useCurrency from '@/store/useCurrency';
import useToast from '@/store/useToast';

export default function ProductList() {
  const toast = useToast();
  const { format } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getMany({ search, limit: 200 });
      if (Array.isArray(res)) {
        setProducts(res);
        setTotal(res.length);
      } else {
        setProducts(res.products || []);
        setTotal(res.total || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSaved = () => {
    fetchProducts();
    toast.success("Mahsulot muvaffaqiyatli saqlandi");
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Mahsulotni o\'chirmoqchimisiz?')) return;
    try {
      await productService.delete(id);
      fetchProducts();
      toast.success("Mahsulot o'chirildi");
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Xatolik yuz berdi');
    }
  };


  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Mahsulotlar</h1>
          <p className="page-subtitle">Jami {total} ta mahsulot</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowAddModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} /> Yangi mahsulot
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-toolbar" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrap">
            <Search size={15} className="input-icon" />
            <input
              className="input-field"
              placeholder="Qidiruv (nomi yoki SKU)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="btn btn-outline" style={{ flex: 1 }}>
              <Filter size={16} /> Filtr
            </button>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 48 }}>Rasm</th>
                <th>Nomi</th>
                <th>SKU</th>
                <th>Turkum</th>
                <th style={{ textAlign: 'right' }}>Sotuv narxi</th>
                <th style={{ textAlign: 'right' }}>Ulgurji narx</th>
                <th style={{ textAlign: 'right' }}>Tannarx</th>
                <th>Qoldiq</th>
                <th>Holat</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2rem' }}>Yuklanmoqda...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2rem' }}>Mahsulot topilmadi</td></tr>
              ) : products.map((p, idx) => (
                <tr key={p.id}>
                  <td className="nav-desktop" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{idx + 1}</td>
                  <td>
                    <div style={{ position: 'relative', width: 42, height: 42 }}>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ 
                            width: 42, height: 42, objectFit: 'cover', 
                            borderRadius: '12px', border: '1px solid var(--border)',
                            display: 'block'
                          }}
                          onError={(e: any) => { 
                            e.target.style.display = 'none'; 
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; 
                          }}
                        />
                      ) : null}
                      <div style={{
                        width: 42, height: 42, background: 'var(--surface-2)', borderRadius: '12px',
                        display: p.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--border)', color: 'var(--text-muted)'
                      }}>
                        <Image size={18} />
                      </div>
                    </div>
                  </td>
                  <td data-label="Mahsulot" style={{ fontWeight: 700 }}>{p.name}</td>
                  <td data-label="SKU" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{p.sku}</td>
                  <td data-label="Turkum" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{p.category?.name}</td>
                  <td data-label="Sotuv narxi" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)' }}>{format(p.sellPrice || 0)}</td>
                  <td data-label="Ulgurji" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{format(p.wholesalePrice || 0)}</td>
                  <td data-label="Tannarx" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{format(p.costPrice || 0)}</td>
                  <td data-label="Qoldiq">
                    <span style={{ fontWeight: 700, color: p.stock <= (p.minStock || 0) ? 'var(--danger)' : 'var(--success)' }}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td data-label="Holat">
                    <span className={`badge ${p.isActive ? 'badge-active' : 'badge-neutral'}`}>
                      {p.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  
                  {/* Custom Metrics Row for Mobile Grid Layout */}
                  <div className="mobile-metrics-row nav-mobile-only">
                    <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{format(p.sellPrice || 0)}</div>
                    <div style={{ fontWeight: 600, color: p.stock <= (p.minStock || 0) ? 'var(--danger)' : 'var(--success)', fontSize: '0.8125rem' }}>
                       {p.stock} {p.unit}
                    </div>
                  </div>

                  <td data-label="Amallar" style={{ textAlign: 'right' }}>
                    {/* Desktop View Actions */}
                    <div className="nav-desktop" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => { setEditProduct(p); setShowAddModal(true); }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Mobile View Actions (Three Dots) */}
                    <div className="nav-mobile-only" style={{ display: 'none' }}>
                       <button 
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={(e) => {
                          const target = e.currentTarget.nextSibling as HTMLElement;
                          if (target) target.style.display = target.style.display === 'none' ? 'block' : 'none';
                        }}
                       >
                         <MoreVertical size={18} />
                       </button>
                       <div className="dropdown-menu" style={{ display: 'none', position: 'absolute', right: '0.5rem', top: '2.5rem', zIndex: 100, boxShadow: 'var(--shadow-lg)' }}>
                          <div className="dropdown-item" onClick={() => { setEditProduct(p); setShowAddModal(true); }}>
                            <Edit2 size={14} /> Tahrirlash
                          </div>
                          <div className="dropdown-item danger" onClick={() => handleDelete(p.id)}>
                            <Trash2 size={14} /> O'chirish
                          </div>
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddProductModal
          onClose={() => { setShowAddModal(false); setEditProduct(null); }}
          onSaved={handleSaved}
          editProduct={editProduct}
        />
      )}
    </div>
  );
}
