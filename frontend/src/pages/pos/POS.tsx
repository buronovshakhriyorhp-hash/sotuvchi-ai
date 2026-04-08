import React, { useState } from 'react';
import { CheckCircle, X, Printer, Grid, ShoppingCart, Wallet } from 'lucide-react';
import usePOS from '../../hooks/usePOS';
import api from '../../api/axios';
import useToast from '../../store/useToast';

// Sub-components
import POSProductGrid from './components/POSProductGrid';
import POSSelectedItems from './components/POSSelectedItems';
import POSCheckoutModal from './components/POSCheckoutModal';

export default function POS() {
  const toast = useToast();
  const pos = usePOS();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const {
    activeTab, setActiveTab, cart, format,
    success, setSuccess, receiptData, printType, setPrintType,
    showAddCustomer, setShowAddCustomer, setCustomers, setSelectedCustomerId,
    handleSell, setMethod, catalog, total
  } = pos;

  // Global Hotkeys removed as requested
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Escape to close modal
      if (e.key === 'Escape' && showCheckout) {
        setShowCheckout(false);
      }
      // Keep search shortcut (Ctrl+F)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCheckout]);

  // Focus management
  React.useEffect(() => {
    if (!success && !showAddCustomer && !showCheckout) {
      searchRef.current?.focus();
    }
  }, [success, showAddCustomer, showCheckout, cart.length]);

  return (
    <div className="fade-in pos-container" style={{ 
      display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem', 
      padding: '1.5rem', background: 'var(--bg)', overflow: 'hidden' 
    }}>

      {/* HEADER */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: 'var(--surface)', padding: '1.25rem 2rem', borderRadius: '24px', 
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', flexShrink: 0
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>Sotuv bo'limi</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Bazada jami {catalog.length} ta mahsulot mavjud</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Jami ({cart.reduce((s,i) => s + i.qty, 0)} dona):
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--primary)' }}>
              {format(total)}
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (cart.length === 0) {
                toast.warning("Sotuvni yakunlash uchun avval mahsulot tanlang!");
                return;
              }
              setShowCheckout(true);
            }} 
            style={{ 
              padding: '1rem 1.5rem', fontSize: '1.125rem', fontWeight: 700, borderRadius: '16px',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: cart.length > 0 ? '0 4px 14px 0 var(--primary)' : 'none',
              cursor: 'pointer'
            }}
          >
            <Wallet size={22} /> Mijoz to'lovi
          </button>
        </div>
      </div>

      {/* MAIN BODY */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* LEFT: Product Grid (Flexible) */}
        <div style={{ flex: '1 1 auto', minWidth: 0, height: '100%', display: activeTab === 'cart' ? 'none' : 'block' }}>
          <POSProductGrid 
            {...pos} 
            searchRef={searchRef}
          />
        </div>
        
        {/* RIGHT: Compact Cart (Fixed width 360px) */}
        <div style={{ width: '360px', flexShrink: 0, height: '100%', display: activeTab === 'products' && window.innerWidth < 1024 ? 'none' : 'block' }} className="pos-selected-items-wrapper">
          <POSSelectedItems {...pos} />
        </div>
      </div>

      {/* Floating Cart Button (Mobile Only) */}
      {cart.length > 0 && activeTab === 'products' && window.innerWidth < 1024 && (
        <button className="floating-cart-btn" onClick={() => setActiveTab('cart')} style={{ background: 'var(--primary)', color: 'var(--primary-deep)' }}>
          <ShoppingCart size={28} />
          <span className="pos-cart-badge" style={{ top: -5, right: -5 }}>
            {cart.reduce((s, i) => s + i.qty, 0)}
          </span>
        </button>
      )}

      {/* Mobile Nav */}
      <div className="pos-bottom-nav mobile-only" style={{ background: 'var(--surface)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
        <button 
          className={`pos-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Grid size={22} color={activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span style={{ color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)' }}>Mahsulotlar</span>
        </button>
        <button 
          className={`pos-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => setActiveTab('cart')}
        >
          <div style={{ position:'relative' }}>
            <ShoppingCart size={22} color={activeTab === 'cart' ? 'var(--primary)' : 'var(--text-muted)'} />
            {cart.length > 0 && (
              <span className="pos-cart-badge" style={{ background: 'var(--primary)', color: 'var(--primary-deep)' }}>
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>
          <span style={{ color: activeTab === 'cart' ? 'var(--primary)' : 'var(--text-muted)' }}>Ro'yxat</span>
        </button>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <POSCheckoutModal 
           onClose={() => setShowCheckout(false)}
           {...pos}
        />
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomer && (
        <div className="modal-overlay" onClick={() => setShowAddCustomer(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yangi mijoz qo'shish</h2>
              <button onClick={() => setShowAddCustomer(false)} className="btn btn-ghost btn-icon"><X size={20}/></button>
            </div>
            <div className="modal-body">
              <form id="add-customer-form" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(fd.entries());
                try {
                  const res = await api.post('/customers', data);
                  const newCustomer = res.data;
                  setCustomers((p: any) => [...p, newCustomer]);
                  setSelectedCustomerId(String(newCustomer.id));
                  setShowAddCustomer(false);
                  toast.success("Mijoz muvaffaqiyatli qo'shildi");
                } catch (err: any) {
                  toast.error(err.response?.data?.error || "Mijoz qo'shib bo'lmadi");
                }
              }}>
                <div className="form-group">
                  <label className="form-label">Mijoz ismi</label>
                  <input name="name" className="input-field" required placeholder="Masalan: Azizbek" />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon raqami</label>
                  <input name="phone" className="input-field" placeholder="+998 90 123 45 67" />
                </div>
                <div className="form-group">
                  <label className="form-label">Manzil (ixtiyoriy)</label>
                  <input name="address" className="input-field" placeholder="Toshkent sh., Yunusobod" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddCustomer(false)} className="btn btn-outline">Bekor qilish</button>
              <button type="submit" form="add-customer-form" className="btn btn-primary">💾 Qo'shish</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {success && receiptData && (
        <div className="modal-overlay" onClick={() => setSuccess(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, background:'var(--success-bg)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                <CheckCircle size={32} color="var(--success)" />
              </div>
              <h2 style={{ fontSize:'1.375rem', fontWeight:800, marginBottom:'0.25rem' }}>Sotuv bajarildi!</h2>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Chek № {receiptData.id}</p>
            </div>

            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <div style={{ background:'var(--surface-2)', borderRadius:'var(--radius)', padding:'1rem', marginBottom:'1.25rem', fontSize:'0.875rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem', fontWeight:700 }}>
                  <span>Jami summma:</span><span style={{ fontSize:'1.125rem' }}>{format(receiptData.total)}</span>
                </div>
                <div style={{ borderTop:'1px dashed var(--border)', marginTop:'0.5rem', paddingTop:'0.5rem' }}>
                  {receiptData.items.map((it: any, i: number) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', padding:'0.15rem 0' }}>
                      <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'60%'}}>{it.name} × {it.qty}</span>
                      <span>{format(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem' }}>
                <button onClick={() => setPrintType('pdf')} className={`btn ${printType === 'pdf' ? 'btn-primary' : 'btn-outline'}`} style={{ flex:1, fontSize:'0.8rem' }}>PDF</button>
                <button onClick={() => setPrintType('thermal')} className={`btn ${printType === 'thermal' ? 'btn-primary' : 'btn-outline'}`} style={{ flex:1, fontSize:'0.8rem' }}>Termal</button>
              </div>

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={() => setSuccess(false)} className="btn btn-outline" style={{ flex:1 }}>Yopish</button>
                <button onClick={() => {
                  if (printType === 'thermal') toast.info("Termal printerga yuborilmoqda...");
                  else window.print();
                }} className="btn btn-primary" style={{ flex:1 }}><Printer size={16}/> Çhiqarish</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
