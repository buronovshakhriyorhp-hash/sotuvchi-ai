import { create } from 'zustand';
import { authService, User } from '../services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  initAuth: () => void;
}

const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,

  initAuth: () => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        set({ 
          user: JSON.parse(storedUser), 
          token: storedToken 
        });
      }
    } catch (e) {
      console.error('Auth initialization error:', e);
      authService.logout();
    }
  },
  
  login: async (phone, password) => {
    try {
      const { user, token } = await authService.login(phone, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token });
      return true;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null });
  },
}));

export default useAuth;
