import api from '../api/axios';
import { User } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(phone: string, password: string): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/login', { phone, password });
  }

  async getMe(): Promise<User> {
    return api.get<User>('/auth/me');
  }

  logout(): void {
    // Faqat auth bilan bog'liq kalitlarni o'chirish — theme, currency, settings saqlanadi
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('nexus_pos_cart');
    localStorage.removeItem('nexus_pos_customer');
    localStorage.removeItem('nexus_pos_discount');
    localStorage.removeItem('nexus_pos_warehouse');
  }
}

export const authService = new AuthService();
