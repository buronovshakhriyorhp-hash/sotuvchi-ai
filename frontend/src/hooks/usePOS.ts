import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api from '../api/axios';
import useToast from '../store/useToast';
import useCurrency from '../store/useCurrency';

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
  const [discountType, setDiscountType] = useState('percent'); // percent | amount
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

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes, custRes, wareRes, topRes] = await Promise.all([
        api.get('/products', { params: { status: 'active', limit: 1000 } }),
        api.get('/categories'),
        api.get('/customers', { params: { limit: 1000 } }),
        api.get('/warehouses'),
        api.get('/reports/top-products', { params: { limit: 20 } }).catch(() => [])
      ]);
      
      const products = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || []);
      const cats = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.categories || []);
      const custs = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.customers || []);
      const wares = Array.isArray(wareRes.data) ? wareRes.data : (wareRes.data?.warehouses || []);
      const topResData = (topRes as any).data || topRes;
      const topProd = Array.isArray(topResData) ? topResData : (topResData?.products || []);
      
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
      toast.error("Ma'lumotlarni yuklashda xatolik!");
    }
  }, [selectedWarehouseId, toast]);

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
      ? { ...i, qty: Math.max(0, Math.min(i.qty + delta, i.stock)) }
      : i).filter(i => i.qty > 0));
  }, []);

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
        items: cart.map(i => ({ productId: i.id, quantity: i.qty, unitPrice: i.sellPrice })),
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
      
      const res = await api.post('/sales', payload);
      const sale = res.data;

      const customerName = customers.find(c => String(c.id) === String(selectedCustomerId))?.name || 'Chakana mijoz';
      const warehouseName = warehouses.find(w => String(w.id) === String(selectedWarehouseId))?.name || 'Ombor';
      
      const receipt = {
        id: sale.receiptNo,
        date: new Date(sale.createdAt).toLocaleString('uz-UZ'),
        items: cart.map(i => ({ ...i, price: i.sellPrice })),
        subtotal, discount, discountAmt, total: sale.total,
        method: method === 'mixed' ? 'Aralash' : method, // Icon logic in component
        customer: customerName,
        warehouse: warehouseName,
        note: note
      };
      
      setReceiptData(receipt);
      setSuccess(true);
      toast.success('Sotuv muvaffaqiyatli amalga oshirildi!');
      
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
      toast.error(err.response?.data?.error || 'Sotuv amalga oshirilmadi');
    } finally {
      setLoading(false);
    }
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
    addToCart, updateQty, removeFromCart, handleSell, fetchData,
    format
  };
}

