import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Nexus ERP Exception Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-container items-center justify-center bg-slate-50">
          <div className="card glass-card text-center fade-in" style={{ maxWidth: '480px', padding: '3rem' }}>
            <div className="flex justify-center mb-6">
              <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', width: '80px', height: '80px' }}>
                <AlertTriangle size={40} />
              </div>
            </div>
            
            <h1 className="page-title mb-4">Tizimda kichik uzilish!</h1>
            
            <p className="text-muted mb-8" style={{ lineHeight: '1.6' }}>
              Xavotirlanmang, Nexus ERP xavfsizlik tizimi yuqori darajada ishlamoqda. 
              Ma'lumotlaringiz xavfsiz holatda saqlangan. Sahifani qayta yuklash orqali ishni davom ettirishingiz mumkin.
            </p>
            
            <div className="flex justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary btn-lg"
              >
                <RefreshCcw size={20} />
                Sahifani Qayta Yuklash
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
