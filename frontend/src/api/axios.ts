import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Define a custom interface to reflect the interceptor unwrapping result
interface ApiInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch'> {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
}

// Generic response structure from backend
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
}) as ApiInstance;

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    // If backend uses { success: true, data: ... }
    const res = response.data;
    if (res && res.success !== undefined) {
      if (res.success) {
        return res.data;
      }
      return Promise.reject(res.error || res.message || 'Xatolik yuz berdi');
    }
    return res;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Tizimda xatolik yuz berdi';

    return Promise.reject(errorMsg);
  }
);

export default api;
