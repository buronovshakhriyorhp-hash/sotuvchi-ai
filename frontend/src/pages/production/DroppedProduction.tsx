import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Search, Calendar, Package, ArrowDownRight, XCircle } from 'lucide-react';
import api from '../../api/axios';
import useToast from '../../store/useToast';

export default function DroppedProduction() {
  const toast = useToast();
  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantity: '', reason: '' });

  const fetchData = async () => {
    try {
      const [txRes, prodRes, wareRes] = await Promise.all([
        api.get('/api/warehouse', { params: { type: 'OUT' } }),
        api.get('/products', { params: { limit: 1000 } }),
        api.get('/api/warehouses')
      ]);
      setData(txRes.data.data.filter(tx => tx.reason && tx.reason.toLowerCase().includes('ishlab chiqarish')));
      setProducts(prodRes.data || []);
      setWarehouses(wareRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/warehouse', {
        ...form,
        type: 'OUT',
        productId: parseInt(form.productId),
        warehouseId: parseInt(form.warehouseId),
        quantity: parseInt(form.quantity),
        reason: `Ishlab chiqarishda brak: ${form.reason}`
      });
      setModalOpen(false);
      setForm({ productId: '', warehouseId: '', quantity: '', reason: '' });
      toast.success("Brak muvaffaqiyatli qayd etildi");
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik'); }
  };


  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Ishlab chiqarishdagi braklar</h1>
          <p className="page-subtitle">Ishlab chiqarish jarayonida yaroqsiz deb topilgan xom-ashyo yoki tayyor mahsulotlar</p>
        </div>
        <button className="btn btn-danger" onClick={() => setModalOpen(true)}>
          <Plus size={18}/> Brakni qayd etish
        </button>
      </div>

      {loading ? <div className="card" style={{textAlign:'center', padding:'3rem'}}>Yuklanmoqda...</div> : (
        <div className="card shadow-sm" style={{ padding:0, overflow:'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Mahsulot</th>
                <th>Ombor</th>
                <th>Soni</th>
                <th>Sababi</th>
                <th>Mas'ul</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? data.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.createdAt).toLocaleDateString('uz-UZ')}</td>
                  <td style={{ fontWeight:600 }}>{tx.product?.name}</td>
                  <td>{tx.warehouse?.name}</td>
                  <td style={{ color:'var(--danger)', fontWeight:700 }}>-{tx.quantity}</td>
                  <td>{tx.reason}</td>
                  <td>{tx.user?.name}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>Hech qanday ma'lumot yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth:'450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Ishlab chiqarish brakini rasmiylashtirish</h2>
              <button className="btn-icon" onClick={()=>setModalOpen(false)}><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Mahsulot *</label>
                  <select className="input-field" required value={form.productId} onChange={e=>setForm({...form, productId: e.target.value})}>
                    <option value="">Tanlang...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ombor *</label>
                  <select className="input-field" required value={form.warehouseId} onChange={e=>setForm({...form, warehouseId: e.target.value})}>
                    <option value="">Tanlang...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Soni *</label>
                  <input className="input-field" type="number" required value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sababi *</label>
                  <textarea className="input-field" required value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} placeholder="Masalan: Mashina buzilishi tufayli..." rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-danger">Harakatni tasdiqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
