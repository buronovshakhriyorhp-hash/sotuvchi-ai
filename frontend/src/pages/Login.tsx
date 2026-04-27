import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../store/useAuth';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuth(s => s.login);
  const navigate = useNavigate();

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as +998 XX XXX XX XX
    if (digits.length === 0) return '';
    if (digits.length <= 3) return '+' + digits;
    if (digits.length <= 5) return '+' + digits.slice(0, 3) + ' ' + digits.slice(3);
    if (digits.length <= 8) return '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 5) + ' ' + digits.slice(5);
    if (digits.length <= 10) return '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 5) + ' ' + digits.slice(5, 8) + ' ' + digits.slice(8);
    return '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 5) + ' ' + digits.slice(5, 8) + ' ' + digits.slice(8, 10) + ' ' + digits.slice(10, 12);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    // Only allow up to 12 digits (998 + 9 digits)
    if (rawValue.length <= 12) {
      setPhone(formatPhone(e.target.value));
    }
  };

  // Xatolik xabarlarini o'zbek tiliga tarjima qilish
  const translateError = (errorMessage: string): string => {
    if (!errorMessage) return 'Kirishda xatolik yuz berdi';
    
    const errorTranslations: Record<string, string> = {
      'password must NOT have fewer than 8 characters': 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak',
      'body/password must NOT have fewer than 8 characters': 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak',
      'Invalid phone or password': 'Telefon raqam yoki parol noto\'g\'ri',
      'Invalid credentials': 'Kirish ma\'lumotlari noto\'g\'ri',
      'User not found': 'Foydalanuvchi topilmadi',
      'Account is disabled': 'Hisob o\'chirilgan',
      'phone is required': 'Telefon raqam kiritilishi shart',
      'password is required': 'Parol kiritilishi shart',
      'Network Error': 'Internet aloqasi yo\'q',
      'Request failed with status code 401': 'Telefon raqam yoki parol noto\'g\'ri',
      'Request failed with status code 400': 'Ma\'lumotlar noto\'g\'ri kiritilgan',
      'Request failed with status code 500': 'Serverda xatolik yuz berdi',
    };
    
    // Aniq mos keluvchi xabarni qidirish
    for (const [key, value] of Object.entries(errorTranslations)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Agar tarjima topilmasa, asl xabarni qaytarish (agar juda uzun bo'lmasa)
    if (errorMessage.length > 100) {
      return 'Kirishda xatolik yuz berdi. Iltimos, ma\'lumotlaringizni tekshiring.';
    }
    
    return errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Frontend validatsiyasi
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 12) {
      setError('Telefon raqam to\'liq kiritilmagan');
      setLoading(false);
      return;
    }
    
    if (password.length < 8) {
      setError('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
      setLoading(false);
      return;
    }
    
    try {
      await login(phone, password);
      // Wait for state to update or check the return value
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (storedUser.role === 'SUPERADMIN') {
        navigate('/gumsmass_645_super_admin_panel');
      } else if (storedUser.role === 'CASHIER') {
        navigate('/pos');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Kirishda xatolik';
      setError(translateError(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--background)', padding:'1rem' }}>
      <div className="card" style={{ width:'100%', maxWidth:'400px', padding:'2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--primary-dark)', letterSpacing:'-0.03em' }}>Nexus ERP</h1>
          <p style={{ color:'var(--text-muted)' }}>Tizimga kirish</p>
        </div>

        {error && (
          <div style={{ 
            background: '#ef4444', 
            color: '#fff', 
            padding: '12px 16px', 
            borderRadius: '10px', 
            marginBottom: '1.5rem', 
            fontSize: '0.9rem', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div>
            <label className="form-label">Telefon raqam</label>
            <input 
              className="input-field" 
              value={phone} 
              onChange={handlePhoneChange} 
              required 
              placeholder="+998 90 123 45 67"
              type="tel"
              autoFocus
              inputMode="tel"
            />
          </div>
          <div>
            <label className="form-label">Parol</label>
            <input 
              className="input-field" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
              minLength={8}
              placeholder="Kamida 8 ta belgi"
            />
            <small style={{ 
              color: password.length > 0 && password.length < 8 ? '#ef4444' : 'var(--text-muted)', 
              fontSize: '0.75rem',
              marginTop: '4px',
              display: 'block'
            }}>
              {password.length > 0 && password.length < 8 
                ? `Parol juda qisqa (hali ${8 - password.length} ta belgi kerak)` 
                : 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak'
              }
            </small>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height:'44px', marginTop:'0.5rem' }}>
            {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.85rem', color:'var(--text-muted)' }}>
          Hisobingiz yo'qmi?{' '}
          <Link to="/register" style={{ color:'var(--primary)', fontWeight:600, textDecoration:'none' }}>
            Ro'yxatdan o'tish
          </Link>
        </div>
      </div>
    </div>
  );
}
