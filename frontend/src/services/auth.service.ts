import api from '../api/axios';

export interface User {
  id: number;
  name: string;
  phone: string;
  role: string | 'ADMIN' | 'CASHIER' | 'MANAGER';
}

export interface LoginResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(phone: string, password: string): Promise<LoginResponse> {
    return (api.post('/auth/login', { phone, password }) as any);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();
