import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Search, Calendar, User, ArrowUpRight, XCircle } from 'lucide-react';
import api from '../../api/axios';
import { Product, Warehouse, User as UserType } from '../../types';

interface Transaction {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  reason: string;
  user?: UserType;
  product?: Product;
  warehouse?: Warehouse;
  createdAt: string;
}

export default function ReturnedCustomer() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantity: '', reason: '' });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [txRes, prodRes, wareRes] = await Promise.all([
        api.get<any>('/api/warehouse', { params: { type: 'IN' } }),
        api.get<any>('/products', { params: { limit: 1000 } }),
        api.get<any>('/api/warehouses')
      ]);
      // Filter for reasons that sound like returns
      const txs = Array.isArray(txRes) ? txRes : (txRes?.data?.data || txRes?.data || []);
      setData(txs.filter((tx: Transaction) => tx.reason && (tx.reason.toLowerCase().includes('qaytdi') || tx.reason.toLowerCase().includes('voz kechish'))));
      
      const prods = Array.isArray(prodRes) ? prodRes : (prodRes?.data || []);
      setCatalog(prods);

      const wares = Array.isArray(wareRes) ? wareRes : (wareRes?.data?.data || wareRes?.data || []);
      setWarehouses(wares);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/warehouse', { 
        ...form, 
        type: 'IN', 
        productId: parseInt(form.productId),
        warehouseId: parseInt(form.warehouseId),
        quantity: parseInt(form.quantity),
        reason: `Mijozdan qaytdi: ${form.reason}`
      });
      setModalOpen(false);
      setForm({ productId: '', warehouseId: '', quantity: '', reason: '' });
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Mijozdan qaytganlar</h1>
          <p className="page-subtitle">Sotilgan mahsulotlarni mijozdan qaytarib olish hisobi</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18}/> Qaytarishni rasmiylashtirish
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>Yuklanmoqda...</div>
      ) : (
        <div className="card shadow-sm" style={{ padding:0, overflow:'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Mahsulot</th>
                <th>Ombor</th>
                <th>Soni</th>
                <th>Sabab</th>
                <th>Mas'ul</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? data.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <Calendar size={14}/> {new Date(tx.createdAt).toLocaleDateString('uz-UZ')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight:600 }}>{tx.product?.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{tx.product?.sku}</div>
                  </td>
                  <td>{tx.warehouse?.name}</td>
                  <td style={{ color:'var(--success)', fontWeight:700 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
                      <ArrowUpRight size={14}/> +{tx.quantity}
                    </div>
                  </td>
                  <td><span className="badge badge-info">{tx.reason}</span></td>
                  <td>{tx.user?.name}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
                    Mijozdan qaytgan mahsulotlar hozircha yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth:'450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Qaytarishni rasmiylashtirish</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)}><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Mahsulot *</label>
                  <select className="input-field" required value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}>
                    <option value="">Mahsulotni tanlang...</option>
                    {catalog.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ombor (Kirim qilinadigan) *</label>
                  <select className="input-field" required value={form.warehouseId} onChange={e => setForm({...form, warehouseId: e.target.value})}>
                    <option value="">Omborni tanlang...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Soni *</label>
                  <input className="input-field" type="number" required min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sababi *</label>
                  <textarea className="input-field" required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Masalan: Razmer tushmadi, nuqsoni bor..." rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Tasdiqlash (Omborga kirim)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
