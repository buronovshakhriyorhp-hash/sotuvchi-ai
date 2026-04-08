import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  currency: 'uzs' | 'usd';
  usdRate: number;
  setCurrency: (currency: 'uzs' | 'usd') => void;
  setUsdRate: (rate: number) => void;
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
