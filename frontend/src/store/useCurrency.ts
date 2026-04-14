import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

interface CurrencyState {
  currency: 'uzs' | 'usd';
  usdRate: number;
  setCurrency: (currency: 'uzs' | 'usd') => void;
  setUsdRate: (rate: number) => void;
  syncWithBackend: () => Promise<void>;
  format: (amountInSom: number) => string;
  formatValue: (amountInSom: number) => string;
  unit: () => string;
  symbol: () => string;
}

const DEFAULT_USD_RATE = 12900;

const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'uzs',
      usdRate: DEFAULT_USD_RATE,

      setCurrency: (currency) => set({ currency }),
      setUsdRate: (rate) => set({ usdRate: rate }),

      syncWithBackend: async () => {
        try {
          const business: any = await api.get('/business/settings');
          const settings = business?.settings;
          if (settings?.usdRate) {
            set({ usdRate: Number(settings.usdRate) });
          }
          if (settings?.baseCurrency) {
            set({ currency: settings.baseCurrency as 'uzs' | 'usd' });
          }
        } catch (err) {
          console.warn('Currency sync failed, using local/default values');
        }
      },

      format: (amountInSom) => {
        const { currency, usdRate } = get();
        if (currency === 'usd') {
          const usd = amountInSom / usdRate;
          return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `${Number(amountInSom).toLocaleString()} so'm`;
      },

      formatValue: (amountInSom) => {
        const { currency, usdRate } = get();
        if (currency === 'usd') {
          const usd = amountInSom / usdRate;
          return usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return Number(amountInSom).toLocaleString();
      },

      unit: () => {
        const { currency } = get();
        return currency === 'usd' ? 'USD' : "so'm";
      },

      symbol: () => {
        const { currency } = get();
        return currency === 'usd' ? '$' : '';
      },
    }),
    { 
      name: 'nexus-currency',
    }
  )
);

export default useCurrency;
