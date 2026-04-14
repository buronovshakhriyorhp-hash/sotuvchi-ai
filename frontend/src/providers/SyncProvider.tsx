import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../db/db';
import api from '../api/axios';
import useToast from '../store/useToast';
import useAuth from '../store/useAuth';

const SyncContext = createContext<{ isOnline: boolean; isSyncing: boolean }>({ isOnline: true, isSyncing: false });

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const toast = useToast();
  const user = useAuth(s => s.user);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) processOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Background sync logic
    let interval: any = null;
    
    if (user && isOnline) {
      // Immediate sync on login/app start
      backgroundSync();
      // Regular interval (every 10 minutes for enterprise stability)
      interval = setInterval(backgroundSync, 10 * 60 * 1000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (interval) clearInterval(interval);
    };
  }, [user, isOnline]);

  const backgroundSync = async () => {
    if (!navigator.onLine || !user) return;
    
    try {
      console.log('🔄 Background Sync: Checking for updates...');
      // Use Promise.all with individual error handling to prevent one failure from stopping everything
      const results = await Promise.allSettled([
        api.get('/products', { params: { limit: 1000 } }),
        api.get('/customers', { params: { limit: 1000 } })
      ]);

      const prodRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const custRes = results[1].status === 'fulfilled' ? results[1].value : null;

      if (prodRes) {
        const products = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.products || [];
        if (products.length > 0) {
          // SMARTER UPDATE: Instead of clear(), we can use bulkPut or similar
          // For now, to ensure data consistency without complicated logic, we still use clear but only if we have data
          await db.products.clear();
          await db.products.bulkAdd(products.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            sellPrice: p.sellPrice,
            stock: p.stock,
            categoryId: p.categoryId,
            categoryName: p.category?.name,
            image: p.image
          })));
        }
      }

      if (custRes) {
        const customers = Array.isArray(custRes.data) ? custRes.data : custRes.data?.customers || [];
        if (customers.length > 0) {
          await db.customers.clear();
          await db.customers.bulkAdd(customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone
          })));
        }
      }

      console.log('✅ Local cache updated.');
    } catch (err) {
      console.warn('Background sync failed:', err);
    }
  };

  const processOfflineQueue = async () => {
    if (!user) return;
    const queue = await db.salesQueue.toArray();
    if (queue.length === 0) return;

    setIsSyncing(true);
    toast.info(`${queue.length} ta oflayn sotuvlar yuborilmoqda...`);

    let successCount = 0;
    for (const sale of queue) {
      try {
        await api.post('/sales', sale.data);
        await db.salesQueue.delete(sale.id!);
        successCount++;
      } catch (err) {
        console.error('Failed to sync sale:', sale, err);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} ta sotuv muvaffaqiyatli sinxronizatsiya qilindi.`);
    }
    setIsSyncing(false);
  };

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing }}>
      {children}
      {!isOnline && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--danger)', color: 'white', padding: '0.5rem 1rem',
          borderRadius: '50px', zIndex: 9999, fontSize: '0.75rem', fontWeight: 'bold',
          boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeUp 0.3s ease-out'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse-soft 1s infinite' }} />
          INTERNET YO'Q - OFLAYN REJIM
        </div>
      )}
      {isSyncing && (
        <div style={{
          position: 'fixed', top: 20, right: 20,
          background: 'var(--primary)', color: 'var(--primary-deep)', padding: '0.5rem 1rem',
          borderRadius: '12px', zIndex: 9999, fontSize: '0.75rem', fontWeight: 'bold',
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--primary-hover)',
          animation: 'fadeUp 0.3s ease-out'
        }}>
          Sinxronizatsiya...
        </div>
      )}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);
