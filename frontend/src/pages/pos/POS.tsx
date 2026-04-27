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

  // Dynamic Hotkeys and Barcode scanner
  React.useEffect(() => {
    let barcodeString = '';
    let barcodeTimeout: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 0. Smart Focus: If user starts typing and not in an input/textarea/modal, focus searchRef
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const isInModal = !!document.querySelector('.modal-overlay');

      if (!isInput && !isInModal && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        searchRef.current?.focus();
      }

      // 1. Barcode scanner listener
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeString += e.key;
        if (barcodeTimeout) clearTimeout(barcodeTimeout);
        // Wait 200ms for next character (safer for various scanners and system load)
        barcodeTimeout = setTimeout(() => { barcodeString = ''; }, 200);
      } else if (e.key === 'Enter' && barcodeString.length >= 3) {
        e.preventDefault();
        const p = catalog.find((x: any) => x.sku === barcodeString || x.barcode === barcodeString || x.id.toString() === barcodeString);
        if (p) {
           pos.addToCart(p);
           toast.success(`${p.name} savatga qo'shildi`);
        } else {
           toast.error(`Mahsulot topilmadi: ${barcodeString}`);
        }
        barcodeString = '';
      }

      // 2. Modals close
      if (e.key === 'Escape') {
        if (showCheckout) setShowCheckout(false);
        if (showAddCustomer) setShowAddCustomer(false);
        if (success) setSuccess(false);
      }

      // Helper function to check combo
      const checkCombo = (e: KeyboardEvent, comboStr: string) => {
        if (!comboStr) return false;
        const parts = comboStr.split(' + ');
        const needsCtrl = parts.includes('Ctrl') || parts.includes('Control');
        const needsAlt = parts.includes('Alt');
        const needsShift = parts.includes('Shift');
        const needsCmd = parts.includes('Cmd') || parts.includes('Meta');
        
        if (e.ctrlKey !== needsCtrl) return false;
        if (e.altKey !== needsAlt) return false;
        if (e.shiftKey !== needsShift) return false;
        if (e.metaKey !== needsCmd) return false;

        const mainKey = parts.find(p => !['Ctrl', 'Alt', 'Shift', 'Cmd', 'Control', 'Meta'].includes(p));
        if (mainKey) {
          const k = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
          if (k !== mainKey) return false;
        }
        return true;
      };

      // 3. Admin Defined Hotkeys
      const checkoutKey = localStorage.getItem('pos_hotkey_checkout') || 'F2';
      const addCustKey = localStorage.getItem('pos_hotkey_addcustomer') || 'F4';
      const searchKey = localStorage.getItem('pos_hotkey_search') || 'Ctrl + F';
      const clearCartKey = localStorage.getItem('pos_hotkey_clearcart') || 'Ctrl + Delete';
      const printPdfKey = localStorage.getItem('pos_hotkey_printpdf') || 'Ctrl + P';
      const printThermalKey = localStorage.getItem('pos_hotkey_printthermal') || 'Ctrl + T';

      if (checkCombo(e, checkoutKey) && !showAddCustomer && !success && !showCheckout) {
        e.preventDefault();
        if (cart.length > 0) {
          setShowCheckout(true);
        } else {
          toast.warning("Sotuvni yakunlash uchun avval mahsulot tanlang!");
        }
      }
      
      if (checkCombo(e, addCustKey) && !showCheckout && !success && !showAddCustomer) {
        e.preventDefault();
        setShowAddCustomer(true);
      }

      if (checkCombo(e, searchKey) && !showCheckout && !success && !showAddCustomer) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (checkCombo(e, clearCartKey) && !showCheckout && !success && !showAddCustomer) {
        e.preventDefault();
        if (cart.length > 0) {
           pos.setCart([]);
           toast.info("Savat tozalandi");
        }
      }

      if (success) {
        if (checkCombo(e, printPdfKey)) {
          e.preventDefault();
          setPrintType('pdf');
          setTimeout(() => window.print(), 100);
        }
        if (checkCombo(e, printThermalKey)) {
          e.preventDefault();
          setPrintType('thermal');
          toast.info("Termal printerga yuborilmoqda...");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCheckout, showAddCustomer, success, cart.length, catalog, handleSell, toast]);

  // Focus management
  React.useEffect(() => {
    if (!success && !showAddCustomer && !showCheckout) {
      searchRef.current?.focus();
    }
  }, [success, showAddCustomer, showCheckout, cart.length]);

  return (
    <div className="fade-in pos-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height))', gap: '1rem', padding: '1rem' }}>

      {/* HEADER */}
      <div className="glass-panel" style={{ 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div className="pos-title-area">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>Sotuv bo'limi</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Bazada {catalog?.length || 0} xil mahsulot</span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border-strong)' }}></div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 700 }}>Online</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="pos-total-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Jami ({(cart || []).reduce((s,i) => s + (i.qty || 0), 0)} dona):
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-deep)', lineHeight: 1 }}>
              {format(total || 0)}
            </div>
          </div>
          
          <button 
            type="button"
            className={`btn btn-lg ${(cart?.length || 0) > 0 ? 'btn-primary' : 'btn-outline'}`} 
            style={{ 
              height: '56px', 
              padding: '0 2rem', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: '1rem', 
              fontWeight: 800,
              boxShadow: (cart?.length || 0) > 0 ? '0 8px 16px -4px rgba(245, 158, 11, 0.4)' : 'none'
            }}
            onClick={() => {
              if (!cart || cart.length === 0) {
                toast.warning("Sotuvni yakunlash uchun avval mahsulot tanlang!");
                return;
              }
              setShowCheckout(true);
            }}
          >
            <Wallet size={20} /> To'lovga o'tish
          </button>
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="pos-body-grid">
        {/* LEFT: Product Grid (Flexible) */}
        <div className={`pos-products-area ${activeTab === 'cart' ? 'mobile-hidden' : ''}`}>
          <POSProductGrid 
            {...pos} 
            searchRef={searchRef}
          />
        </div>
        
        {/* RIGHT: Compact Cart */}
        <div className={`pos-cart-area ${activeTab === 'products' ? 'mobile-hidden' : ''}`}>
          <POSSelectedItems {...pos} />
        </div>
      </div>

      {/* Floating Cart Button (Mobile Only) */}
      {(cart?.length || 0) > 0 && activeTab === 'products' && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <button type="button" className="floating-cart-btn" onClick={() => setActiveTab('cart')} style={{ background: 'var(--primary)', color: 'var(--primary-deep)' }}>
          <ShoppingCart size={28} />
          <span className="pos-cart-badge" style={{ top: -5, right: -5 }}>
            {(cart || []).reduce((s, i) => s + (i.qty || 0), 0)}
          </span>
        </button>
      )}

      {/* Mobile Nav */}
      <div className="pos-bottom-nav mobile-only" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button 
          type="button"
          className={`pos-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Grid size={22} color={activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span style={{ color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)' }}>Mahsulotlar</span>
        </button>
        <button 
          type="button"
          className={`pos-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => setActiveTab('cart')}
        >
          <div style={{ position:'relative' }}>
            <ShoppingCart size={22} color={activeTab === 'cart' ? 'var(--primary)' : 'var(--text-muted)'} />
            {(cart?.length || 0) > 0 && (
              <span className="pos-cart-badge" style={{ background: 'var(--primary)', color: 'var(--primary-deep)' }}>
                {(cart || []).reduce((s, i) => s + (i.qty || 0), 0)}
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
        <div className="modal-overlay" style={{ zIndex: 1050 }} onClick={() => setShowAddCustomer(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yangi mijoz qo'shish</h2>
              <button type="button" onClick={() => setShowAddCustomer(false)} className="btn btn-ghost btn-icon"><X size={20}/></button>
            </div>
            <div className="modal-body">
              <form id="add-customer-form" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(fd.entries());
                try {
                  const newCustomer = await api.post('/customers', data);
                  setCustomers((p: any) => [...p, newCustomer]);
                  setSelectedCustomerId(String(newCustomer.id));
                  setShowAddCustomer(false);
                  toast.success("Mijoz muvaffaqiyatli qo'shildi");
                } catch (err: any) {
                  const message = typeof err === 'string'
                    ? err
                    : err?.response?.data?.error || err?.message || "Mijoz qo'shib bo'lmadi";
                  toast.error(message);
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
              <button type="button" onClick={() => setShowAddCustomer(false)} className="btn btn-outline">Bekor qilish</button>
              <button type="submit" form="add-customer-form" className="btn btn-primary">💾 Qo'shish</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {success && receiptData && (
        <div className="modal-overlay" style={{ zIndex: 1050 }} onClick={() => setSuccess(false)}>
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
                  <span>Jami summma:</span><span style={{ fontSize:'1.125rem' }}>{format(receiptData.total || 0)}</span>
                </div>
                <div style={{ borderTop:'1px dashed var(--border)', marginTop:'0.5rem', paddingTop:'0.5rem' }}>
                  {(receiptData.items || []).map((it: any, i: number) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', padding:'0.15rem 0' }}>
                      <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'60%'}}>{it.name} × {it.qty}</span>
                      <span>{format((it.price || 0) * (it.qty || 0))}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem' }}>
                <button type="button" onClick={() => setPrintType('pdf')} className={`btn ${printType === 'pdf' ? 'btn-primary' : 'btn-outline'}`} style={{ flex:1, fontSize:'0.8rem' }}>PDF</button>
                <button type="button" onClick={() => setPrintType('thermal')} className={`btn ${printType === 'thermal' ? 'btn-primary' : 'btn-outline'}`} style={{ flex:1, fontSize:'0.8rem' }}>Termal</button>
              </div>

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button type="button" onClick={() => setSuccess(false)} className="btn btn-outline" style={{ flex:1 }}>Yopish</button>
                <button type="button" onClick={() => {
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
