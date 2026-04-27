import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: 'calc(100vh - var(--navbar-height) - 2rem)',
      padding: '2rem'
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '420px',
        background: 'var(--surface)',
        padding: '3rem',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          background: 'var(--surface-2)', 
          border: '2px dashed var(--border-strong)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1.5rem' 
        }}>
          <FileQuestion size={36} style={{ color: 'var(--text-muted)' }} />
        </div>
        
        <h1 style={{ 
          fontSize: '5rem', 
          fontWeight: 800, 
          color: 'var(--text)', 
          marginBottom: '0.5rem',
          lineHeight: 1
        }}>
          404
        </h1>
        
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 700, 
          color: 'var(--text)', 
          marginBottom: '0.75rem' 
        }}>
          Sahifa topilmadi
        </h2>
        
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.9375rem', 
          lineHeight: 1.6,
          marginBottom: '1.5rem'
        }}>
          Siz qidirayotgan sahifa o'chirilgan, nomi o'zgartirilgan yoki vaqtinchalik mavjud emas.
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-outline"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}
          >
            <ArrowLeft size={18} />
            Orqaga
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}
          >
            <Home size={18} />
            Bosh sahifa
          </button>
        </div>
      </div>
    </div>
  );
}
