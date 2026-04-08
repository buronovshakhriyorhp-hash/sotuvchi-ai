import { create } from 'zustand';

interface ThemeState {
  theme: string;
  toggleTheme: () => void;
  initTheme: () => void;
}

const useTheme = create<ThemeState>((set) => ({
  theme: localStorage.getItem('nexus-theme') || 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('nexus-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  initTheme: () => {
    const stored = localStorage.getItem('nexus-theme') || 'light';
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: stored });
  }
}));

export default useTheme;
