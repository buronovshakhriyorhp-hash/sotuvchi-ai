import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

interface Warehouse {
  id: number;
  name: string;
}

interface SettingsState {
  language: string;
  activeWarehouseId: string | null;
  warehouses: Warehouse[];
  setLanguage: (lang: string) => void;
  setActiveWarehouseId: (id: string | null) => void;
  fetchWarehouses: () => Promise<void>;
}

const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'uz',
      activeWarehouseId: null,
      warehouses: [],
      
      setLanguage: (lang) => set({ language: lang }),
      setActiveWarehouseId: (id) => set({ activeWarehouseId: id }),
      
      fetchWarehouses: async () => {
        try {
          // Bu fetch request api.get orqali omborlar ro'yxatini yuklaydi
          const res: any = await api.get('/warehouses');
          const data = Array.isArray(res) ? res : res?.warehouses || [];
          
          set({ warehouses: data });
          
          // Agar joriy ombor tanlanmagan bo'lsa va omborlar mavjud bo'lsa, birinchisini tanlash
          const { activeWarehouseId } = get();
          if (!activeWarehouseId && data.length > 0) {
            set({ activeWarehouseId: String(data[0].id) });
          }
        } catch (err) {
          console.error("Omborlarni yuklashda xatolik:", err);
        }
      }
    }),
    { name: 'nexus-settings' }
  )
);

export default useSettings;
