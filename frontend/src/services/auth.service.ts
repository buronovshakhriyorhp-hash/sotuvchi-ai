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
    localStorage.clear(); // Nuclear logout for security
  }
}

export const authService = new AuthService();
