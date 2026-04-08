import React, { useState, useEffect, useRef } from 'react';
import {
  X, Settings, Plus, Trash2, CreditCard, Download, Search
} from 'lucide-react';
import api from '../api/axios';
import AddProductModal from './AddProductModal';
import PaymentModal from './PaymentModal';
import useCurrency from '../store/useCurrency';
import useToast from '../store/useToast';
import SearchableSelect from './SearchableSelect';

export default function NewSaleModal({ onClose, onSaved }) {
  const toast = useToast();
  const { format } = useCurrency();

  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [items, setItems] = useState([]);
  
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [note, setNote] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().substring(0, 10));

  const [productSearch, setProductSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQty, setSelectedQty] = useState('');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const qtyRef = useRef(null);
  const searchRef = useRef(null);

  const fetchAll = async () => {
    try {
      const [custRes, wareRes, staffRes] = await Promise.all([
        api.get('/customers', { params: { limit: 1000 } }),
        api.get('/warehouses'),
        api.get('/staff'),
      ]);
      setCustomers(Array.isArray(custRes) ? custRes : (custRes?.customers || []));
      const wares = Array.isArray(wareRes) ? wareRes : (wareRes?.warehouses || []);
      setWarehouses(wares);
      setStaff(Array.isArray(staffRes) ? staffRes : (staffRes?.staff || []));
      if (wares.length > 0) setWarehouseId(String(wares[0].id));
    } catch (err) { console.error('NewSaleModal err:', err); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!productSearch.trim() || selectedProduct?.name === productSearch) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/products', { params: { search: productSearch, status: 'active', limit: 20 } });
        setSuggestions(res?.products || res || []);
      } catch { setSuggestions([]); }
    }, 200);
    return () => clearTimeout(t);
  }, [productSearch]);

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setSuggestions([]);
    setTimeout(() => qtyRef.current?.focus(), 100);
  };

  const addItem = () => {
    if (!selectedProduct) return;
    const qty = parseFloat(selectedQty);
    if (!qty || qty <= 0) return;

    setItems(prev => {
      const exists = prev.find(i => i.productId === selectedProduct.id);
      if (exists) {
        return prev.map(i => i.productId === selectedProduct.id
          ? { ...i, qty: i.qty + qty, total: (i.qty + qty) * i.price }
          : i);
      }
      return [...prev, {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        qty,
        unit: selectedProduct.unit || 'dona',
        packageQty: selectedProduct.packageQty || 1,
        price: selectedProduct.sellPrice,
        total: qty * selectedProduct.sellPrice,
      }];
    });

    setSelectedProduct(null);
    setProductSearch('');
    setSelectedQty('');
    searchRef.current?.focus();
  };

  const removeItem = (productId) => setItems(prev => prev.filter(i => i.productId !== productId));

  const updateItemQty = (productId, newQty) => {
    const q = parseFloat(newQty);
    if (!q || q <= 0) return;
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty: q, total: q * i.price } : i));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);

  const buildPayload = () => ({
    items: items.map(i => ({ productId: i.productId, quantity: i.qty, unitPrice: i.price })),
    warehouseId: warehouseId ? parseInt(warehouseId) : 1,
    customerId: customerId ? parseInt(customerId) : null,
    paymentMethod: 'cash',
    cashAmount: subtotal,
    cardAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    discount: 0,
    discountType: 'percent',
    note,
  });

  const handleSave = async (print = false) => {
    if (items.length === 0) return toast.warning('Savat bo\'sh!');
    if (!warehouseId) return toast.warning('Ombor tanlash shart!');

    try {
      const res = await api.post('/sales', buildPayload());
      toast.success("Sotuv saqlandi");
      onSaved(res);
      onClose();
      if (print) window.print();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Xatolik yuz berdi');
    }
  };

  const handleOpenPayment = () => {
    if (items.length === 0) return toast.warning('Mahsulotlar qo\'shing!');
    setShowPayment(true);
  };

  const handlePaymentConfirmed = (sale, print) => {
    setShowPayment(false);
    onSaved(sale);
    onClose();
    if (print) window.print();
  };

  const selectedCustomer = customers.find(c => String(c.id) === customerId);

  return (
    <>
      {/* Same modal pattern as AddProductModal */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 1100, maxHeight: '92vh' }}>
          
          {/* ===== HEADER ===== */}
          <div className="modal-header">
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>Yangi sotuv</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Mijoz: <b style={{ color: 'var(--text)' }}>{selectedCustomer?.name || "Noma'lum"}</b>
                {selectedCustomer && <> · Qarz: <b>0</b> · Bonus: <b style={{ color: '#eab308' }}>0</b></>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: 160 }}>
                <SearchableSelect
                  options={warehouses}
                  value={warehouseId}
                  onChange={setWarehouseId}
                  placeholder="Ombor"
                  labelKey="name"
                  valueKey="id"
                  className="navbar-select-searchable"
                />
              </div>
              <span className="badge badge-warning" style={{ borderRadius: '99px', padding: '0.3rem 0.8rem' }}>Tasdiqlanmagan</span>
              <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20}/></button>
            </div>
          </div>

          {/* ===== BODY ===== */}
          <div className="modal-body" style={{ padding: 0 }}>
            <div className="grid-2-cols">
              
              {/* ====== LEFT COLUMN ====== */}
              <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Asosiy ma'lumotlar */}
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asosiy ma'lumotlar</div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Sana</label>
                    <input type="date" className="input-field" value={saleDate} onChange={e=>setSaleDate(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Mijoz</label>
                    <SearchableSelect
                      options={customers}
                      value={customerId}
                      onChange={setCustomerId}
                      placeholder="Mijoz tanlang"
                      labelKey="name"
                      valueKey="id"
                      renderOption={(c) => (
                        <div style={{ display:'flex', flexDirection:'column' }}>
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{c.phone || 'Tel ko\'rsatilmagan'}</span>
                        </div>
                      )}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Mas'ul xodim</label>
                    <SearchableSelect
                      options={staff}
                      value={staffId}
                      onChange={setStaffId}
                      placeholder="Mas'ul xodimni tanlang"
                      labelKey="name"
                      valueKey="id"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Umumiy qiymati</label>
                    <input type="text" className="input-field" readOnly value={format(subtotal)} style={{ background: 'var(--surface-2)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark)' }} />
                  </div>
                </div>

                {/* Izoh */}
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Izoh</div>
                  <textarea className="input-field" rows={3} placeholder="Bu yerga qo'shimcha ma'lumot kiritishingiz mumkin" value={note} onChange={e=>setNote(e.target.value)} />
                </div>
              </div>

              {/* ====== RIGHT COLUMN ====== */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Mahsulot qo'shish */}
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mahsulot qo'shish</div>
                  <div className="form-group" style={{ marginBottom: '0.75rem', position: 'relative' }}>
                    <label className="form-label">Mahsulot nomi</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <SearchableSelect
                          options={suggestions}
                          value={selectedProduct?.id}
                          onChange={(id) => {
                            const p = suggestions.find(s => s.id === id);
                            if (p) selectProduct(p);
                          }}
                          placeholder="Mahsulot nomini kiriting yoki izlang..."
                          labelKey="name"
                          valueKey="id"
                          renderOption={(p) => (
                            <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
                              <span style={{ fontWeight: 500 }}>{p.name}</span>
                              <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{format(p.sellPrice)}</span>
                            </div>
                          )}
                        />
                      </div>
                      <button className="btn btn-outline btn-icon btn-sm" title="Yangi mahsulot" onClick={() => setShowAddProduct(true)}><Plus size={16}/></button>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Soni</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        ref={qtyRef}
                        type="number" 
                        className="input-field" 
                        placeholder="Sonini kiriting" 
                        value={selectedQty}
                        onChange={e=>setSelectedQty(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                        style={{ flex: 1 }}
                      />
                      <button onClick={addItem} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                        <Plus size={14}/> Qo'shish
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mahsulotlar jadvali */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savatdagi mahsulotlar</div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{items.length} ta</span>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                    <table className="table" style={{ minWidth: 'auto', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Nomi</th>
                          <th style={{ textAlign: 'center' }}>Soni</th>
                          <th style={{ textAlign: 'right' }}>Narx</th>
                          <th style={{ textAlign: 'right' }}>Jami</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Mahsulot qo'shing</td></tr>
                        ) : items.map((item, idx) => (
                          <tr key={item.productId}>
                            <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="number" 
                                value={item.qty} 
                                onChange={e => updateItemQty(item.productId, e.target.value)}
                                style={{ width: 60, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.4rem', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, fontSize: '0.8125rem' }}
                              />
                            </td>
                            <td style={{ textAlign: 'right', fontSize: '0.75rem' }}>{format(item.price)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)' }}>{format(item.total)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => removeItem(item.productId)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Jami */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 0', borderTop: '2px solid var(--border)', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>Jami: {format(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="modal-footer">
            <button onClick={onClose} className="btn btn-outline">Bekor qilish</button>
            <button onClick={() => handleSave(false)} className="btn btn-primary" style={{ display: 'flex', gap: '0.4rem' }}>
              💾 Saqlash
            </button>
            <button onClick={() => handleSave(true)} className="btn btn-primary" style={{ display: 'flex', gap: '0.4rem' }}>
              🖨 Saqlash va chek
            </button>
            <button onClick={handleOpenPayment} className="btn btn-success" style={{ display: 'flex', gap: '0.4rem' }}>
              <CreditCard size={15}/> Mijoz to'lovi
            </button>
          </div>
        </div>
      </div>

      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} onSaved={(p) => { selectProduct(p); setShowAddProduct(false); }} />
      )}

      {showPayment && (
        <PaymentModal
          sale={{ subtotal, payload: buildPayload(), customerId: customerId ? parseInt(customerId) : null }}
          customers={customers}
          onClose={() => setShowPayment(false)}
          onConfirmed={handlePaymentConfirmed}
        />
      )}
    </>
  );
}
