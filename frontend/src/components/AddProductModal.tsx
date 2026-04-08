import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { X, Upload, RefreshCw, Plus, ImageOff, Package, Tag, Barcode, DollarSign, Layers, Info, Loader2 } from 'lucide-react';
import { categoryService, Category } from '@/services/category.service';
import { productService, Product } from '@/services/product.service';
import { warehouseService, Warehouse } from '@/services/warehouse.service';

interface AddProductModalProps {
  onClose: () => void;
  onSaved: (product: any) => void;
  editProduct?: Product | null;
}

interface ProductForm {
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  packageName: string;
  packageQty: string;
  packageWeight: string;
  barcode: string;
  sellPrice: string | number;
  wholesalePrice: string | number;
  costPrice: string | number;
  stock: string | number;
  minStock: string | number;
  syncCostToWarehouses: boolean;
  type: string;
  warehouseId: string;
}

export default function AddProductModal({ onClose, onSaved, editProduct = null }: AddProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductForm>({
    sku: '',
    name: '',
    categoryId: '',
    unit: 'dona',
    packageName: "qut,paket,o'ram",
    packageQty: '',
    packageWeight: '',
    barcode: '',
    sellPrice: '',
    wholesalePrice: '',
    costPrice: '',
    stock: '',
    minStock: '5',
    syncCostToWarehouses: false,
    type: 'Mahsulotlar',
    warehouseId: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchWarehouses();
    if (editProduct) {
      setForm({
        sku: editProduct.sku || '',
        name: editProduct.name || '',
        categoryId: String(editProduct.category?.id || ''),
        unit: editProduct.unit || 'dona',
        packageName: (editProduct as any).packageName || '',
        packageQty: (editProduct as any).packageQty || '',
        packageWeight: (editProduct as any).packageWeight || '',
        barcode: (editProduct as any).barcode || '',
        sellPrice: editProduct.sellPrice || '',
        wholesalePrice: editProduct.wholesalePrice || '',
        costPrice: editProduct.costPrice || '',
        stock: editProduct.stock || '',
        minStock: editProduct.minStock || '5',
        syncCostToWarehouses: false,
        type: 'Mahsulotlar',
        warehouseId: '',
      });
      if (editProduct.image) setImagePreview(editProduct.image);
    }
  }, [editProduct]);

  // Sync stock when warehouse changes for existing products
  useEffect(() => {
    if (editProduct && editProduct.stocks && form.warehouseId) {
      const warehouseStock = editProduct.stocks.find(s => String(s.warehouseId) === form.warehouseId);
      setForm(f => ({ ...f, stock: warehouseStock ? String(warehouseStock.quantity) : '0' }));
    }
  }, [form.warehouseId]);

  const fetchWarehouses = async () => {
    try {
      const res = await warehouseService.getMany();
      setWarehouses(res);
      if (res.length > 0 && !form.warehouseId) {
        const firstWhId = String(res[0].id);
        const newState: Partial<ProductForm> = { warehouseId: firstWhId };
        
        // If editing, find the stock of this specific warehouse
        if (editProduct && editProduct.stocks) {
          const ws = editProduct.stocks.find(s => String(s.warehouseId) === firstWhId);
          newState.stock = ws ? String(ws.quantity) : '0';
        }
        
        setForm(f => ({ ...f, ...newState }));
      }
    } catch {
      setWarehouses([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res: any = await categoryService.getMany();
      setCategories(res.categories || res || []);
    } catch { 
      setCategories([]); 
    }
  };

  const generateBarcode = () => {
    const code = '177' + Math.floor(Math.random() * 9999999999).toString().padStart(10, '0');
    setForm(f => ({ ...f, barcode: code.slice(0, 13) }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return setError('Faqat JPG, PNG, GIF yoki WebP formatdagi rasmlar qabul qilinadi!');
    }
    if (file.size > 5 * 1024 * 1024) {
      return setError('Rasm hajmi 5MB dan oshmasligi kerak!');
    }
    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await categoryService.create(newCategoryName.trim());
      setCategories(prev => [...prev, res]);
      setForm(f => ({ ...f, categoryId: String(res.id) }));
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      setError("Turkum qo'shib bo'lmadi");
    }
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) return setError('Mahsulot nomi majburiy!');
    if (!form.categoryId) return setError('Turkum tanlash majburiy!');
    if (!form.sellPrice) return setError('Sotish narxi majburiy!');
    if (!form.barcode) return setError('Shtrix kod majburiy!');

    setLoading(true);
    try {
      const fd = new FormData();
      const generatedSku = form.sku || (form.name.trim().substring(0, 4).toUpperCase() + '-' + Date.now().toString().slice(-6));
      fd.append('sku', generatedSku);
      fd.append('name', form.name.trim());
      fd.append('categoryId', form.categoryId);
      fd.append('unit', form.unit || 'dona');
      fd.append('sellPrice', String(form.sellPrice));
      fd.append('wholesalePrice', String(form.wholesalePrice || 0));
      fd.append('costPrice', String(form.costPrice || 0));
      fd.append('barcode', form.barcode);
      fd.append('stock', String(form.stock || '0'));
      fd.append('minStock', String(form.minStock || '5'));
      fd.append('warehouseId', form.warehouseId);
      if (form.packageName) fd.append('packageName', form.packageName);
      if (form.packageQty) fd.append('packageQty', form.packageQty);
      if (form.packageWeight) fd.append('packageWeight', form.packageWeight);
      if (imageFile) fd.append('image', imageFile, imageFile.name);

      let res: any;
      if (editProduct) {
        res = await productService.update(editProduct.id, fd as any);
      } else {
        res = await productService.create(fd as any);
      }
      onSaved(res);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(10px)', background: 'rgba(15, 23, 42, 0.4)' }}>
      <div 
        className="modal-content modal-lg animate-in" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '1000px', borderRadius: '28px', padding: 0, overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.98)', border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary-bg)', color: 'var(--primary-dark)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editProduct ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"}</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Barcha ma'lumotlarni aniqlik bilan kiriting</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ borderRadius: '12px' }}><X size={20} /></button>
        </div>

        {/* Global Error */}
        {error && (
          <div style={{ background: '#fef2f2', borderBottom: '1px solid #fca5a5', color: '#991b1b', padding: '1rem 2rem', fontSize: '0.875rem', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Body content */}
        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* LEFT COLUMN: Main Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Section 1: General */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>
                <Info size={18} /> <span style={{ fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Umumiy ma'lumotlar</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Mahsulot nomi <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="input-field"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Masalan: Nike Air Max 270"
                    style={{ height: '48px', borderRadius: '12px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>SKU</label>
                  <input
                    className="input-field"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    placeholder="Avto-generatsiya"
                    style={{ height: '48px', borderRadius: '12px', background: '#fff' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Turkum <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {showAddCategory ? (
                      <div style={{ display: 'flex', gap: '0.4rem', width: '100%' }}>
                        <input className="input-field" style={{ flex: 1, height: '42px', borderRadius: '10px' }} value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} autoFocus />
                        <button className="btn btn-primary btn-sm" onClick={handleAddCategory}>OK</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowAddCategory(false)}>X</button>
                      </div>
                    ) : (
                      <>
                        <select className="input-field" style={{ flex: 1, height: '42px', borderRadius: '10px' }} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                          <option value="">Tanlang</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button className="btn btn-outline btn-icon" style={{ height: '42px', width: '42px', borderRadius: '10px' }} onClick={() => setShowAddCategory(true)}><Plus size={18} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>O'lchov birligi</label>
                  <input className="input-field" style={{ height: '42px', borderRadius: '10px' }} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="dona" />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>
                <DollarSign size={18} /> <span style={{ fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Narx va moliya</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Sotuv narxi <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" className="input-field" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} style={{ height: '48px', borderRadius: '12px', border: !form.sellPrice ? '2px solid #fee2e2' : '1px solid var(--border)' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Ulgurji narxi</label>
                  <input type="number" className="input-field" value={form.wholesalePrice} onChange={e => setForm(f => ({ ...f, wholesalePrice: e.target.value }))} style={{ height: '48px', borderRadius: '12px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Tannarxi</label>
                  <input type="number" className="input-field" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} style={{ height: '48px', borderRadius: '12px' }} />
                </div>
              </div>
            </div>

            {/* Section 3: Inventory */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>
                <Barcode size={18} /> <span style={{ fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventar va Shtrix-kod</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Ombor</label>
                  <select className="input-field" style={{ height: '48px', borderRadius: '12px' }} value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Mavjud miqdor</label>
                  <input type="number" className="input-field" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={{ height: '48px', borderRadius: '12px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Minimal qoldiq</label>
                  <input type="number" className="input-field" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} style={{ height: '48px', borderRadius: '12px' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Shtrix-kod <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input-field" style={{ flex: 1, height: '48px', borderRadius: '12px', fontSize: '1.125rem', letterSpacing: '0.1em', fontWeight: 600 }} value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
                  <button className="btn btn-primary" onClick={generateBarcode} style={{ borderRadius: '12px', whiteSpace: 'nowrap', gap: '0.5rem' }}><RefreshCw size={16} /> Auto</button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Media & Extra */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Image Upload */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '2px dashed var(--border)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                <Tag size={16} /> <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Mahsulot rasmi</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              
              <div 
                onClick={() => fileRef.current?.click()}
                style={{ 
                  width: '100%', height: '220px', background: '#f8fafc', borderRadius: '18px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.3s', border: '1px solid var(--border)',
                  overflow: 'hidden'
                }}
              >
                {imagePreview ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.75rem' }}>
                      Rasmni almashtirish uchun bosing
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ background: '#fff', width: '54px', height: '54px', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <Upload size={24} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rasm yuklash</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Maks 5MB (JPG, PNG, WebP)</span>
                  </>
                )}
              </div>
              {imagePreview && (
                <button onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.75rem auto 0' }}><ImageOff size={14} /> Rasmni olib tashlash</button>
              )}
            </div>

            {/* Additional Settings */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>
                <Layers size={18} /> <span style={{ fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Boshqa sozlamalar</span>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Mahsulot turi</label>
                <select className="input-field" style={{ height: '42px', borderRadius: '10px' }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Mahsulotlar">Tayyor mahsulot</option>
                  <option value="Xomashyo">Xomashyo</option>
                  <option value="Xizmat">Xizmatlar</option>
                </select>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'#fff', borderRadius:'12px', border:'1px solid var(--border)' }}>
                 <div 
                    onClick={() => setForm(f => ({ ...f, syncCostToWarehouses: !f.syncCostToWarehouses }))}
                    style={{ 
                      width: 40, height: 22, borderRadius: 11, background: form.syncCostToWarehouses ? 'var(--primary)' : '#d1d5db',
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                    }}
                 >
                   <div style={{ position: 'absolute', top: 2, left: form.syncCostToWarehouses ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: '0.3s' }} />
                 </div>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tannarxni barcha omborlarda yangilash</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', background: '#fff', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ height: '52px', padding: '0 2rem', borderRadius: '14px', fontWeight: 700 }}>Bekor qilish</button>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="btn btn-primary" 
            style={{ height: '52px', padding: '0 3rem', borderRadius: '14px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)' }}
          >
            {loading ? <Loader2 className="animate-spin" size={22} /> : '💾 MAHSULOTNI SAQLASH'}
          </button>
        </div>
      </div>
    </div>
  );
}
