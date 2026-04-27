import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Trash2, CreditCard, Save, ShoppingCart, User as UserIcon, Building2, Calendar, StickyNote, PackageSearch
} from 'lucide-react';
import api from '../api/axios';
import AddProductModal from './AddProductModal';
import PaymentModal from './PaymentModal';
import useCurrency from '../store/useCurrency';
import useToast from '../store/useToast';
import { Product, Customer, User } from '../types';

// Custom SearchableSelect component since we removed the import
function SearchableSelect({ options, value, onChange, placeholder, labelKey, valueKey, renderOption }: any) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '36px'
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => (
        <option key={opt[valueKey]} value={opt[valueKey]}>
          {opt[labelKey]}
        </option>
      ))}
    </select>
  );
}

interface SaleItemDraft {
  productId: number;
  name: string;
  qty: number;
  unit: string;
  packageQty: number;
  price: number;
  total: number;
}

interface NewSaleModalProps {
  onClose: () => void;
  onSaved: (sale: any) => void;
}

export default function NewSaleModal({ onClose, onSaved }: NewSaleModalProps) {
  const toast = useToast();
  const { format } = useCurrency();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]); // Using any for warehouses since not in types yet
  const [staff, setStaff] = useState<User[]>([]);
  const [items, setItems] = useState<SaleItemDraft[]>([]);
  
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [note, setNote] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().substring(0, 10));

  const [productSearch, setProductSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState('');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'mijoz' | 'mahsulot'>('mijoz');

  const qtyRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'mijoz' as const, label: "Mijoz ma'lumotlari" },
    { id: 'mahsulot' as const, label: 'Mahsulotlar' },
  ];

  const fetchAll = async () => {
    try {
      const [custRes, wareRes, staffRes] = await Promise.all([
        api.get('/customers', { params: { limit: 1000 } }) as Promise<any>,
        api.get('/warehouses') as Promise<any>,
        api.get('/staff') as Promise<any>,
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
        const res: any = await api.get('/products', { params: { search: productSearch, status: 'active', limit: 20 } });
        setSuggestions(res?.products || res || []);
      } catch { setSuggestions([]); }
    }, 200);
    return () => clearTimeout(t);
  }, [productSearch]);

  const selectProduct = (product: Product) => {
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
        packageQty: 1, // Defaulting packageQty
        price: selectedProduct.price || selectedProduct.sellPrice || 0,
        total: qty * (selectedProduct.price || selectedProduct.sellPrice || 0),
      }];
    });

    setSelectedProduct(null);
    setProductSearch('');
    setSelectedQty('');
    searchRef.current?.focus();
  };

  const removeItem = (productId: number) => setItems(prev => prev.filter(i => i.productId !== productId));

  const updateItemQty = (productId: number, newQty: string) => {
    const q = parseFloat(newQty);
    if (!q || q <= 0) return;
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty: q, total: q * i.price } : i));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);

  const buildPayload = () => ({
    items: items.map(i => ({ productId: i.productId, quantity: i.qty, unitPrice: i.price })),
    warehouseId: warehouseId ? parseInt(warehouseId) : 1,
    customerId: customerId ? parseInt(customerId) : null,
    paymentMethod: 'cash' as const,
    cashAmount: subtotal,
    cardAmount: 0,
    bankAmount: 0,
    debtAmount: 0,
    discount: 0,
    discountType: 'percent' as const,
    note,
  });

  const handleSave = async (print: boolean = false) => {
    if (items.length === 0) return toast.warning('Savat bo\'sh!');
    if (!warehouseId) return toast.warning('Ombor tanlash shart!');

    try {
      const res: any = await api.post('/sales', buildPayload());
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

  const handlePaymentConfirmed = (sale: any, print: boolean) => {
    setShowPayment(false);
    onSaved(sale);
    onClose();
    if (print) window.print();
  };

  return (
    <>
      {/* Fullscreen New Sale Modal */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: 'white',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          borderBottom: '1px solid #e5e5e5',
          background: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#333', margin: 0 }}>Yangi sotuv</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {activeTab === 'mahsulot' && items.length > 0 && (
              <>
                <button
                  onClick={() => handleSave(false)}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#9333ea',
                    color: 'white'
                  }}
                >
                  <Save size={16} />
                  Saqlash
                </button>
                <button
                  onClick={handleOpenPayment}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#10b981',
                    color: 'white'
                  }}
                >
                  <CreditCard size={16} />
                  To'lov
                </button>
              </>
            )}
            <button
              onClick={() => {
                if (confirm("Haqiqatan ham yopmoqchimisiz? Saqlanmagan o'zgarishlar yo'qoladi.")) {
                  onClose();
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '5px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', background: '#fafafa' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '30px',
            background: 'white',
            padding: '8px',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            width: 'fit-content'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 24px',
                  background: activeTab === tab.id ? '#9333ea' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: activeTab === tab.id ? 'white' : '#666',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Mijoz ma'lumotlari */}
          {activeTab === 'mijoz' && (
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              maxWidth: '800px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px 20px'
              }}>
                {/* Ombor */}
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={16} color="#9333ea" />
                    Ombor <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px'
                    }}
                  >
                    {warehouses.length === 0 && <option value="">Omborlar yo'q</option>}
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                {/* Mijoz */}
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={16} color="#9333ea" />
                    Mijoz
                  </label>
                  <select
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px'
                    }}
                  >
                    <option value="">Mijoz tanlang (ixtiyoriy)</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>)}
                  </select>
                </div>

                {/* Sana */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} color="#9333ea" />
                    Sana
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Mas'ul xodim */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={16} color="#9333ea" />
                    Mas'ul xodim
                  </label>
                  <select
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px'
                    }}
                  >
                    <option value="">Xodim tanlang</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Izoh */}
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StickyNote size={16} color="#9333ea" />
                    Izoh
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Qo'shimcha ma'lumot..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Mahsulotlar */}
          {activeTab === 'mahsulot' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
              {/* Left: Product Search and Add */}
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#9333ea',
                  marginBottom: '20px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #9333ea',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <PackageSearch size={18} />
                  Mahsulot qo'shish
                </div>

                {/* Product Search */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#333', marginBottom: '8px', display: 'block' }}>
                    Mahsulot qidirish
                  </label>
                  <input
                    type="text"
                    placeholder="Mahsulot nomini kiriting..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div style={{
                      border: '1px solid #e5e5e5',
                      borderRadius: '6px',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: 'white',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {suggestions.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => selectProduct(p)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{p.name}</span>
                          <span style={{ fontWeight: 600, color: '#9333ea' }}>{format(p.price || p.sellPrice || 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity and Add */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <input
                    ref={qtyRef}
                    type="number"
                    placeholder="Soni"
                    value={selectedQty}
                    onChange={e => setSelectedQty(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem()}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    min="0.01"
                    step="0.01"
                  />
                  <button
                    onClick={addItem}
                    style={{
                      padding: '10px 20px',
                      background: '#9333ea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={16} />
                    Qo'shish
                  </button>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    style={{
                      padding: '10px',
                      background: 'white',
                      color: '#666',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Yangi mahsulot"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Selected Product Info */}
                {selectedProduct && (
                  <div style={{
                    padding: '16px',
                    background: '#f5f0ff',
                    borderRadius: '8px',
                    border: '1px solid #9333ea'
                  }}>
                    <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>{selectedProduct.name}</div>
                    <div style={{ fontSize: '14px', color: '#9333ea', fontWeight: 500 }}>{format(selectedProduct.price || selectedProduct.sellPrice || 0)}</div>
                  </div>
                )}
              </div>

              {/* Right: Cart Items */}
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #9333ea'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#9333ea', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingCart size={18} />
                    Savat ({items.length} ta)
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#9333ea' }}>{format(subtotal)}</div>
                </div>

                {items.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#9ca3af',
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '2px dashed #e5e5e5'
                  }}>
                    <ShoppingCart size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '14px' }}>Mahsulot qo'shing</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 0',
                          borderBottom: '1px solid #f3f4f6'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, color: '#333', marginBottom: '2px' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{format(item.price)} x {item.qty} {item.unit}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={e => updateItemQty(item.productId, e.target.value)}
                            style={{
                              width: '60px',
                              textAlign: 'center',
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                            min="0.01"
                            step="0.01"
                          />
                          <div style={{ fontWeight: 600, color: '#9333ea', minWidth: '80px', textAlign: 'right' }}>
                            {format(item.total)}
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            style={{
                              padding: '6px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
