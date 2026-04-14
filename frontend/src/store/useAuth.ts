import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { User } from '../types';

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

  initAuth: async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        set({ 
          user: JSON.parse(storedUser), 
          token: storedToken 
        });

        // Background verification
        try {
          const freshUser = await authService.getMe();
          localStorage.setItem('user', JSON.stringify(freshUser));
          set({ user: freshUser });
        } catch (error) {
          console.warn('Session expired or invalid token:', error);
          authService.logout();
          set({ user: null, token: null });
        }
      }
    } catch (e) {
      console.error('Auth initialization error:', e);
      authService.logout();
      set({ user: null, token: null });
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
