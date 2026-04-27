import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { X, Upload, RefreshCw, Plus, Save } from 'lucide-react';
import { Category, Product, Warehouse } from '../types';
import { categoryService } from '../services/category.service';
import { productService } from '../services/product.service';
import { warehouseService } from '../services/warehouse.service';

interface AddProductModalProps {
  onClose: () => void;
  onSaved: (product: Product) => void;
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

type TabType = 'mahsulot' | 'narxi' | 'ombor';

export default function AddProductModal({ onClose, onSaved, editProduct = null }: AddProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('mahsulot');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductForm>({
    sku: '',
    name: '',
    categoryId: '',
    unit: 'dona',
    packageName: "quti, paket, o'ram",
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

  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'mahsulot', label: 'Mahsulot nomi' },
    { id: 'narxi', label: 'Narxi' },
    { id: 'ombor', label: 'Ombor' },
  ];

  const handleAddWarehouse = async () => {
    if (!newWarehouseName.trim()) return;
    try {
      const res = await warehouseService.create({ name: newWarehouseName.trim() });
      setWarehouses(prev => [...prev, res]);
      setForm(f => ({ ...f, warehouseId: String(res.id) }));
      setNewWarehouseName('');
      setShowAddWarehouse(false);
    } catch (err) {
      setError("Ombor qo'shib bo'lmadi");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchWarehouses();
    if (editProduct) {
      setForm({
        sku: editProduct.sku || '',
        name: editProduct.name || '',
        categoryId: String(editProduct.categoryId || editProduct.category?.id || ''),
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
    } else {
      // Auto-generate barcode only for NEW products
      generateBarcode();
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

  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(file); // Fallback on reader error
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => resolve(file); // Fallback if image format not supported
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1024;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            }, 'image/webp', 0.85);
          } catch (err) {
            resolve(file); // Safe fallback
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const optimized = await optimizeImage(file);
      setImageFile(optimized);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(optimized);
      setError('');
    } catch (err) {
      setError("Rasmni qayta ishlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
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

  const validateForm = (): boolean => {
    if (!form.name.trim()) { setError('Mahsulot nomi majburiy'); return false; }
    if (!form.categoryId) { setError('Turkum tanlash majburiy'); return false; }
    if (!form.sellPrice) { setError('Sotish narxi majburiy'); return false; }
    if (!form.barcode) { setError('Shtrix kod majburiy'); return false; }
    return true;
  };

  return (
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
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#333', margin: 0 }}>
          {editProduct ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#9333ea',
              color: 'white',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <span>Yuklanmoqda...</span>
            ) : (
              <>
                <Save size={16} />
                Saqlash
              </>
            )}
          </button>
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
        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

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
              onClick={() => { setActiveTab(tab.id); setError(''); }}
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

        {/* Tab 1: Mahsulot nomi */}
        {activeTab === 'mahsulot' && (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px 20px'
            }}>
              {/* Mahsulot nomi */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  Mahsulot nomi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Mahsulot nomini kiriting"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Turkum */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Turkum</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {showAddCategory ? (
                    <>
                      <input
                        type="text"
                        placeholder="Yangi turkum"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={handleAddCategory}
                        style={{
                          padding: '10px 16px',
                          background: '#9333ea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setShowAddCategory(false)}
                        style={{
                          padding: '10px 16px',
                          background: '#f3f4f6',
                          color: '#666',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        X
                      </button>
                    </>
                  ) : (
                    <>
                      <select
                        value={form.categoryId}
                        onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                        style={{
                          flex: 1,
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
                        <option value="">Turkumni tanlang</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button
                        onClick={() => setShowAddCategory(true)}
                        title="Yangi turkum qo'shish"
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#666'
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Section divider */}
              <div style={{
                gridColumn: '1 / -1',
                fontSize: '16px',
                fontWeight: 600,
                color: '#9333ea',
                margin: '10px 0 0 0',
                paddingBottom: '10px',
                borderBottom: '2px solid #9333ea'
              }}>
                O'lchov birligi
              </div>

              {/* O'lchov birligi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  O'lchov birligi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="dona"
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* O'ramlar nomi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>O'ramlar nomi</label>
                <input
                  type="text"
                  placeholder="quti, paket, o'ram"
                  value={form.packageName}
                  onChange={e => setForm(f => ({ ...f, packageName: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* O'ramlar soni */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>O'ramlar soni</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.packageQty}
                  onChange={e => setForm(f => ({ ...f, packageQty: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* O'ram og'irligi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>O'ram og'irligi</label>
                <input
                  type="text"
                  placeholder="kg"
                  value={form.packageWeight}
                  onChange={e => setForm(f => ({ ...f, packageWeight: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* SKU */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>SKU (Artikul)</label>
                <input
                  type="text"
                  placeholder="Kod kiriting"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Narxi */}
        {activeTab === 'narxi' && (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px 20px'
            }}>
              {/* Sotish narxi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  Sotish narxi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.sellPrice}
                  onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Ulgurji narxi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Ulgurji narxi</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.wholesalePrice}
                  onChange={e => setForm(f => ({ ...f, wholesalePrice: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Sotib olingan narxi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Sotib olingan narxi</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.costPrice}
                  onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Toggle */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <label style={{ position: 'relative', width: '48px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.syncCostToWarehouses}
                    onChange={e => setForm(f => ({ ...f, syncCostToWarehouses: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: form.syncCostToWarehouses ? '#9333ea' : '#d1d5db',
                    borderRadius: '24px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: form.syncCostToWarehouses ? '27px' : '3px',
                      bottom: '3px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s'
                    }} />
                  </span>
                </label>
                <span style={{ fontSize: '14px', color: '#666' }}>Boshqa omborlarga ham sotib olingan narxni biriktirish</span>
              </div>

              {/* Section divider */}
              <div style={{
                gridColumn: '1 / -1',
                fontSize: '16px',
                fontWeight: 600,
                color: '#9333ea',
                margin: '20px 0 0 0',
                paddingBottom: '10px',
                borderBottom: '2px solid #9333ea'
              }}>
                Mahsulot rasmi
              </div>

              {/* Image upload */}
              <div style={{ gridColumn: '1 / -1' }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '40px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: imagePreview ? 'white' : '#fafafa'
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <Upload size={48} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '14px', color: '#666' }}>Mahsulotga rasm yuklash</div>
                    </>
                  )}
                </div>
                {imagePreview && (
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={{
                      marginTop: '10px',
                      fontSize: '13px',
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Rasmni olib tashlash
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Ombor */}
        {activeTab === 'ombor' && (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px 20px'
            }}>
              {/* Section divider */}
              <div style={{
                gridColumn: '1 / -1',
                fontSize: '16px',
                fontWeight: 600,
                color: '#9333ea',
                margin: '0 0 0 0',
                paddingBottom: '10px',
                borderBottom: '2px solid #9333ea'
              }}>
                Inventar
              </div>

              {/* Shtrix kod */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  Shtrix kod <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                  <input
                    type="text"
                    placeholder="1776794215706"
                    value={form.barcode}
                    onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    onClick={generateBarcode}
                    style={{
                      background: '#9333ea',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={14} />
                    EAN13
                  </button>
                </div>
              </div>

              {/* Ombor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Ombor</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {showAddWarehouse ? (
                    <>
                      <input
                        type="text"
                        placeholder="Yangi ombor"
                        value={newWarehouseName}
                        onChange={e => setNewWarehouseName(e.target.value)}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={handleAddWarehouse}
                        style={{
                          padding: '10px 16px',
                          background: '#9333ea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setShowAddWarehouse(false)}
                        style={{
                          padding: '10px 16px',
                          background: '#f3f4f6',
                          color: '#666',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        X
                      </button>
                    </>
                  ) : (
                    <>
                      <select
                        value={form.warehouseId}
                        onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}
                        style={{
                          flex: 1,
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
                      <button
                        onClick={() => setShowAddWarehouse(true)}
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#666'
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Qoldiq */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Qoldiq</label>
                <input
                  type="text"
                  placeholder="Mahsulot qoldiq'i"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Ogohlantiruv */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Ogohlantiruv</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.minStock}
                  onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Section divider */}
              <div style={{
                gridColumn: '1 / -1',
                fontSize: '16px',
                fontWeight: 600,
                color: '#9333ea',
                margin: '20px 0 0 0',
                paddingBottom: '10px',
                borderBottom: '2px solid #9333ea'
              }}>
                Mahsulot yoki xomashyo
              </div>

              {/* Turi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Turi</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
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
                  <option>Mahsulotlar</option>
                  <option>Xomashyo</option>
                  <option>Xizmatlar</option>
                </select>
              </div>

              {/* Saralash */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Saralash</label>
                <input
                  type="number"
                  value="0"
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
