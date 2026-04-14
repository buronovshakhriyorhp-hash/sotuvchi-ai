import { create } from 'zustand';

export type ThemeType = 'default' | 'theme-blue' | 'theme-green' | 'theme-dark';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  initTheme: () => void;
}

const useTheme = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('app-theme') as ThemeType) || 'default',
  setTheme: (newTheme) => {
    const root = document.documentElement;
    root.classList.remove('theme-blue', 'theme-green', 'theme-dark', 'dark');
    
    if (newTheme !== 'default') {
      root.classList.add(newTheme);
      if (newTheme === 'theme-dark') {
        root.classList.add('dark');
      }
    }
    
    localStorage.setItem('app-theme', newTheme);
    set({ theme: newTheme });
  },
  initTheme: () => {
    const stored = (localStorage.getItem('app-theme') as ThemeType) || 'default';
    const root = document.documentElement;
    root.classList.remove('theme-blue', 'theme-green', 'theme-dark', 'dark');
    
    if (stored !== 'default') {
      root.classList.add(stored);
      if (stored === 'theme-dark') {
        root.classList.add('dark');
      }
    }
    set({ theme: stored });
  }
}));

export default useTheme;
