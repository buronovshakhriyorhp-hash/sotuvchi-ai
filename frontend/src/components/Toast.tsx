import React from 'react';
import useToast from '../store/useToast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--info)',
};

const Toast = ({ toast }) => {
  const removeToast = useToast(state => state.removeToast);
  const Icon = ICONS[toast.type] || Info;

  return (
    <div className={`toast-item ${toast.type}`}>
      <div className="toast-icon">
        <Icon size={18} color={COLORS[toast.type]} />
      </div>
      <div className="toast-message">{toast.message}</div>
      <button className="toast-close" onClick={() => removeToast(toast.id)}>
        <X size={14} />
      </button>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar" 
          style={{ animationDuration: `${toast.duration}ms` }}
        ></div>
      </div>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useToast(state => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
