import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (msg: string, dur?: number) => void;
  error: (msg: string, dur?: number) => void;
  warning: (msg: string, dur?: number) => void;
  info: (msg: string, dur?: number) => void;
}

const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  success: (msg, dur) => {
    const { addToast } = useToast.getState();
    addToast(msg, 'success', dur);
  },
  error: (msg, dur) => {
    const { addToast } = useToast.getState();
    addToast(msg, 'error', dur);
  },
  warning: (msg, dur) => {
    const { addToast } = useToast.getState();
    addToast(msg, 'warning', dur);
  },
  info: (msg, dur) => {
    const { addToast } = useToast.getState();
    addToast(msg, 'info', dur);
  },
}));

export default useToast;
