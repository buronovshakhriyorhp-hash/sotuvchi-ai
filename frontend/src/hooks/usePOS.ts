import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api from '../api/axios';
import useToast from '../store/useToast';
import useCurrency from '../store/useCurrency';
import { db } from '../db/db';

interface Product {
  id: number;
  name: string;
  sku: string;
  sellPrice: number;
  stock: number;
  unit: string;
  minStock: number;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface CartItem extends Product {
  qty: number;
  originalSellPrice?: number; // narx o'zgartirilganda original saqlanadi (audit uchun)
}

export default function usePOS() {
  const toast = useToast();
  const { format } = useCurrency();
  
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [method, setMethod] = useState('cash');
  
  // Mixed Payment Amounts
  const [amounts, setAmounts] = useState({ cash: 0, card: 0, bank: 0, debt: 0 });
  
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [note, setNote] = useState('');
  
  const [success, setSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [printType, setPrintType] = useState<'pdf' | 'thermal'>('pdf'); 
  const [loading, setLoading] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [sortMode, setSortMode] = useState<'top' | 'alpha'>('top'); 
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products'); 
  
  const searchRef = useRef<HTMLInputElement>(null);

  // --- Persistence Logic ---
  // Load initial state from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('nexus_pos_cart');
    const savedCustomer = localStorage.getItem('nexus_pos_customer');
    const savedDiscount = localStorage.getItem('nexus_pos_discount');
    const savedWarehouse = localStorage.getItem('nexus_pos_warehouse');

    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch(e) { console.error(e); }
    }
    if (savedCustomer) setSelectedCustomerId(savedCustomer);
    if (savedDiscount) setDiscount(Number(savedDiscount));
    if (savedWarehouse) setSelectedWarehouseId(savedWarehouse);
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('nexus_pos_cart', JSON.stringify(cart));
    localStorage.setItem('nexus_pos_customer', selectedCustomerId);
    localStorage.setItem('nexus_pos_discount', String(discount));
    localStorage.setItem('nexus_pos_warehouse', selectedWarehouseId);
  }, [cart, selectedCustomerId, discount, selectedWarehouseId]);

  const fetchData = useCallback(async () => {
    try {
      // 1. Try to load from Dexie first (Quick load)
      const cachedProds = await db.products.toArray();
      const cachedCusts = await db.customers.toArray();
      if (cachedProds.length > 0) setCatalog(cachedProds as any);
      if (cachedCusts.length > 0) setCustomers(cachedCusts as any);

      if (!navigator.onLine) {
        console.log('POS: Offline mode, using cached data.');
        return;
      }

      // 2. Fetch from API
      const [prodRes, catRes, custRes, wareRes, topRes] = await Promise.all([
        api.get<any>('/products', { params: { status: 'active', limit: 1000 } }),
        api.get<any>('/categories'),
        api.get<any>('/customers', { params: { limit: 1000 } }),
        api.get<any>('/warehouses'),
        api.get<any>('/reports/top-products', { params: { limit: 20 } }).catch(() => null)
      ]);
      
      const products = Array.isArray(prodRes) ? prodRes : (prodRes?.products || []);
      const cats = Array.isArray(catRes) ? catRes : (catRes?.categories || []);
      const custs = Array.isArray(custRes) ? custRes : (custRes?.customers || []);
      const wares = Array.isArray(wareRes) ? wareRes : (wareRes?.warehouses || []);
      const topProd = Array.isArray(topRes) ? topRes : [];
      
      setCatalog(products);
      setCategories(cats);
      setCustomers(custs);
      setWarehouses(wares);
      setTopProducts(topProd);
      
      if (wares.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(String(wares[0].id));
      }
    } catch (err) { 
      console.error('POS fetchData error:', err); 
      // If API fails, we already have cached data in state if it existed
      if (catalog.length === 0) {
        toast.warning("Internet yo'q, lokal ma'lumotlar yuklanmoqda...");
      }
    }
  }, [selectedWarehouseId, toast, catalog.length]);

  useEffect(() => {
    searchRef.current?.focus();
    fetchData();
  }, []);

  const displayedProducts = useMemo(() => {
    let list = [...catalog];
    
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    
    // Category filter
    if (selectedCategoryId !== 'all') {
      list = list.filter(p => p.categoryId === Number(selectedCategoryId));
    }

    // Sort
    if (sortMode === 'top') {
      const topIds = topProducts.map(p => p.id);
      list.sort((a, b) => {
        const aIdx = topIds.indexOf(a.id);
        const bIdx = topIds.indexOf(b.id);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return list;
  }, [catalog, search, selectedCategoryId, sortMode, topProducts]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      toast.error('Bu mahsulot qolmagan!');
      return;
    }
    setCart((prev: CartItem[]) => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, product.stock) } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setSearch('');
    searchRef.current?.focus();
  }, [toast]);

  const updateQty = useCallback((id: number, delta: number) => {
    setCart((prev: CartItem[]) => prev.map(i => i.id === id
      // Float precision fix: toFixed(6) prevents 0.1+0.2=0.300000...004
      ? { ...i, qty: parseFloat(Math.max(0, Math.min(i.qty + delta, i.stock)).toFixed(6)) }
      : i));
  }, []);

  /**
   * Sotuvchi tomonidan mahsulot narxini o'zgartirish.
   * originalSellPrice saqlab qolinadi — sotuv auditi logida egaga ko'rinadi.
   */
  const updatePrice = useCallback((id: number, newPrice: number) => {
    if (!newPrice || newPrice <= 0) {
      toast.error("Narx 0 dan katta bo'lishi kerak");
      return;
    }
    setCart((prev: CartItem[]) => prev.map(i => {
      if (i.id !== id) return i;
      return {
        ...i,
        sellPrice: parseFloat(newPrice.toFixed(2)),
        // originalSellPrice faqat birinchi marta o'zgartirish paytida saqlanadi
        originalSellPrice: i.originalSellPrice ?? i.sellPrice,
      };
    }));
    toast.info("Narx o'zgartirildi — sotuv hisobotida egaga ko'rinadi");
  }, [toast]);

  const removeFromCart = useCallback((id: number) => setCart((prev: CartItem[]) => prev.filter(i => i.id !== id)), []);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.sellPrice * i.qty, 0), [cart]);
  
  const discountAmt = useMemo(() => {
    return discountType === 'percent' 
      ? Math.round(subtotal * discount / 100) 
      : (Number(discount) || 0);
  }, [subtotal, discount, discountType]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmt), [subtotal, discountAmt]);

  // Auto-distribute values if not 'mixed'
  useEffect(() => {
    if (method !== 'mixed') {
      setAmounts({ cash: 0, card: 0, bank: 0, debt: 0, [method]: total });
    }
  }, [method, total]);

  const handleSell = async () => {
    if (cart.length === 0) return;
    if (!selectedWarehouseId) {
      toast.warning("Sotuv uchun ombor tanlanishi shart!");
      return;
    }
    
    const totalPaid = amounts.cash + amounts.card + amounts.bank + amounts.debt;
    if (method === 'mixed' && Math.abs(totalPaid - total) > 10) {
      toast.error(`Kiritilgan summalar yig'indisi (${format(totalPaid)}) umumiy summaga (${format(total)}) teng bo'lishi kerak!`);
      return;
    }
    if (amounts.debt > 0 && !selectedCustomerId) {
      toast.warning("Qarzga sotish uchun mijoz tanlash majburiy!");
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        items: cart.filter(i => i.qty > 0).map(i => ({ productId: i.id, quantity: i.qty, unitPrice: i.sellPrice })),
        paymentMethod: method,
        cashAmount: amounts.cash,
        cardAmount: amounts.card,
        bankAmount: amounts.bank,
        debtAmount: amounts.debt,
        discount: Number(discount),
        discountType: discountType,
        customerId: selectedCustomerId || null,
        warehouseId: parseInt(selectedWarehouseId),
        note: note
      };
      
      let sale;
      let isOfflineSaved = false;

      if (navigator.onLine) {
        try {
          const res = await api.post('/sales', payload);
          sale = res;
        } catch (apiErr: any) {
          console.error('Online sale failed, falling back to offline:', apiErr);
          // Only fallback if it's a network error or 5xx server error
          const isNetworkError = !apiErr.response;
          const isServerError = apiErr.response?.status >= 500;
          
          if (isNetworkError || isServerError) {
            sale = await _saveOffline(payload);
            isOfflineSaved = true;
          } else {
            // Re-throw client errors (4xx) to be handled by the outer catch
            throw apiErr;
          }
        }
      } else {
        sale = await _saveOffline(payload);
        isOfflineSaved = true;
      }

      const customerName = customers.find(c => String(c.id) === String(selectedCustomerId))?.name || 'Chakana mijoz';
      const warehouseName = warehouses.find(w => String(w.id) === String(selectedWarehouseId))?.name || 'Ombor';
      
      const receipt = {
        id: sale.receiptNo,
        date: new Date(sale.createdAt || Date.now()).toLocaleString('uz-UZ'),
        items: cart.map(i => ({ ...i, price: i.sellPrice })),
        subtotal, discount, discountAmt, total: sale.total,
        method: method === 'mixed' ? 'Aralash' : method,
        customer: customerName,
        warehouse: warehouseName,
        note: note
      };
      
      setReceiptData(receipt);
      setSuccess(true);
      
      if (isOfflineSaved) {
        toast.info("Offline: Sotuv navbatga saqlandi (Server bilan aloqa yo'q).");
      } else {
        toast.success('Sotuv muvaffaqiyatli amalga oshirildi!');
      }
      
      // Reset state
      setCart([]);
      setSearch('');
      setDiscount(0);
      setAmounts({ cash: 0, card: 0, bank: 0, debt: 0 });
      setMethod('cash');
      setSelectedCustomerId('');
      setNote('');
      fetchData();
    } catch (err: any) {
      console.error('POS Sell error:', err);
      const message = typeof err === 'string'
        ? err
        : err?.response?.data?.error || err?.message || 'Sotuv amalga oshirilmadi';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Internal helper for offline saving
  const _saveOffline = async (payload: any) => {
    const offlineSaleId = `OFF-${Date.now()}`;
    await db.salesQueue.add({
      data: payload,
      createdAt: Date.now()
    });
    
    // Update local stock immediately in state and Dexie
    for (const item of cart) {
      const prod = catalog.find(p => p.id === item.id);
      if (prod) {
        const newStock = prod.stock - item.qty;
        await db.products.update(item.id, { stock: newStock });
      }
    }

    return {
      receiptNo: offlineSaleId,
      total: total,
      createdAt: new Date().toISOString()
    };
  };

  return {
    // State
    search, setSearch,
    catalog, categories, selectedCategoryId, setSelectedCategoryId,
    customers, setCustomers,
    warehouses, selectedWarehouseId, setSelectedWarehouseId,
    cart, setCart,
    method, setMethod,
    amounts, setAmounts,
    discount, setDiscount,
    discountType, setDiscountType,
    selectedCustomerId, setSelectedCustomerId,
    note, setNote,
    success, setSuccess,
    receiptData, setReceiptData,
    printType, setPrintType,
    loading, setLoading,
    showAddCustomer, setShowAddCustomer,
    sortMode, setSortMode,
    activeTab, setActiveTab,
    topProducts,
    
    // Computed
    displayedProducts,
    subtotal, discountAmt, total,
    
    // Refs
    searchRef,
    
    // Handlers
    addToCart, updateQty, updatePrice, removeFromCart, handleSell, fetchData,
    format
  };
}

