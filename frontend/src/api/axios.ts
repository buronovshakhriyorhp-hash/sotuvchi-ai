import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import useAuth from '../store/useAuth';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuth.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // If backend uses { success: true, data: ... }
    if (response.data && response.data.success !== undefined) {
      if (response.data.success) {
        return response.data.data;
      }
      return Promise.reject(response.data.error || response.data.message || 'Xatolik yuz berdi');
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuth.getState().logout();
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
