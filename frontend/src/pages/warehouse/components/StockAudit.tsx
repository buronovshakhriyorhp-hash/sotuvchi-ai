import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, RefreshCw, AlertCircle, History } from 'lucide-react';
import api from '../../../api/axios';
import useToast from '../../../store/useToast';

interface ProductStock {
  productId: number;
  product: { id: number; name: string; sku: string; stock: number; unit: string };
  quantity: number;
}

interface StockAuditProps {
  onClose: () => void;
  onSuccess: () => void;
  warehouseId: number;
  warehouseName: string;
}

export default function StockAudit({ onClose, onSuccess, warehouseId, warehouseName }: StockAuditProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stocks, setStocks] = useState<ProductStock[]>([]);
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const toast = useToast();

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/warehouses/stock', { params: { warehouseId } });
      setStocks(res || []);
      // Initialize local quantities with current database stock
      const initial: Record<number, string> = {};
      (res || []).forEach((s: any) => {
        initial[s.product.id] = s.quantity.toString();
      });
      setQuantities(initial);
    } catch (err) {
      toast.error('Qoldiqlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [warehouseId]);

  const handleUpdate = (productId: number, val: string) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const saveAudit = async (productId: number) => {
    const realQuantity = parseFloat(quantities[productId]);
    if (isNaN(realQuantity)) return toast.error('Yaroqsiz miqdor');

    // Ensure we have a warehouseId, fallback to 1 if missing in both prop and state
    const wId = warehouseId || 1;

    try {
      await api.post('/warehouses/reconcile', {
        productId,
        warehouseId: wId,
        realQuantity
      });
      toast.success('Yangilandi');
      fetchStocks();
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : (err?.response?.data?.message || err?.message || 'Saqlashda xatolik'));
    }
  };

  const filtered = stocks.filter(s => 
    s.product.name.toLowerCase().includes(search.toLowerCase()) || 
    s.product.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={e => e.stopPropagation()} style={{ width: '580px' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(to right, var(--surface), var(--primary-light))', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary)', padding: '0.625rem', borderRadius: '12px', color: 'var(--primary-deep)', boxShadow: 'var(--shadow-md)' }}>
              <History size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.125rem' }}>Inventarizatsiya</h2>
              <p className="modal-subtitle" style={{ fontSize: '0.75rem' }}>{warehouseName} • Qoldiqlarni tekshirish</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ borderRadius: '50%' }}><X size={20}/></button>
        </div>

        <div className="modal-body" style={{ background: 'var(--bg)', padding: '1.25rem' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', paddingBottom: '1rem' }}>
            <div className="search-input-wrap" style={{ maxWidth: '100%', minWidth: '100%' }}>
              <Search size={18} className="input-icon" />
              <input 
                className="input-field" 
                placeholder="Mahsulot nomi yoki SKU bo'yicha qidirish..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ paddingLeft: '3rem', borderRadius: 'var(--radius-lg)', height: '48px', boxShadow: 'var(--shadow-sm)' }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="table-empty py-16">
                <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                <p style={{ fontWeight: 500 }}>Ma'lumotlar yuklanmoqda...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="table-empty py-16">
                <History size={48} style={{ marginBottom: '1.25rem', opacity: 0.1 }} />
                <p style={{ fontWeight: 500 }}>Mahsulot topilmadi</p>
              </div>
            ) : filtered.map(s => {
              const currentReal = parseFloat(quantities[s.product.id]);
              const diff = currentReal - s.quantity;
              const hasChanged = quantities[s.product.id] !== s.quantity.toString();

              return (
                <div key={s.product.id} className="card" style={{ padding: '1.25rem', border: hasChanged ? '2px solid var(--primary)' : '1px solid var(--border)', transform: hasChanged ? 'scale(1.02)' : 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.4, color: 'var(--text)' }}>{s.product.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ background: 'var(--surface-2)', padding: '0.125rem 0.375rem', borderRadius: '4px', fontFamily: 'monospace' }}>{s.product.sku}</span>
                        <span>•</span>
                        <span>Baza: <strong style={{ color: 'var(--text-secondary)' }}>{s.quantity} {s.product.unit}</strong></span>
                      </div>
                    </div>
                    {diff !== 0 && (
                      <div className={`badge ${diff > 0 ? 'badge-active' : 'badge-danger'}`} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                        {diff > 0 ? '+' : ''}{diff} {s.product.unit} farq
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display:'block', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Haqiqiy qoldiqni kiriting</label>
                      <input 
                        type="number" 
                        className="input-field"
                        style={{ height: '48px', fontWeight: 700, fontSize: '1.25rem', border: hasChanged ? '2px solid var(--primary)' : '1.5px solid var(--border)', textAlign: 'center' }}
                        value={quantities[s.product.id]}
                        onChange={e => handleUpdate(s.product.id, e.target.value)}
                      />
                    </div>
                    <button 
                      className={`btn ${hasChanged ? 'btn-primary' : 'btn-outline'}`}
                      style={{ height: '48px', minWidth: '110px', borderRadius: 'var(--radius-lg)' }}
                      disabled={!hasChanged}
                      onClick={() => saveAudit(s.product.id)}
                    >
                      {hasChanged ? 'Saqlash' : 'Saqlangan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem', boxShadow: '0 -4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            <AlertCircle size={16} /> Farqlar avtomatik tarzda tranzaksiyaga yoziladi.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={onClose} style={{ flex: 1, height: '48px' }}>Yopish</button>
            <button className="btn btn-primary" onClick={() => { onSuccess(); onClose(); }} style={{ flex: 1.5, height: '48px' }}>Barchasi tayyor</button>
          </div>
        </div>
      </div>
    </div>
  );
}
