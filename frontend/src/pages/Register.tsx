import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../store/useAuth';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

export default function Register() {
  const navigate = useNavigate();
  const login = useAuth(s => s.login);
  const [form, setForm] = useState({
    storeName: '',
    adminName: '',
    phone: '+998',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.storeName.trim()) return setError('Kompaniya nomini kiriting');
    if (!form.adminName.trim()) return setError('Ism familyangizni kiriting');
    if (form.phone.length < 13) return setError("To'liq telefon raqam kiriting");
    if (form.password.length < 6) return setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");

    setLoading(true);
    try {
      // 1. Ro'yxatdan o'tish
      const res = await fetch(`${API_BASE}/api/saas/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: form.storeName.trim(),
          adminName: form.adminName.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Xatolik yuz berdi');

      // 2. Avtomatik login va dashboardga yo'naltirish
      await login(form.phone.trim(), form.password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Serverga ulanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <div className="card" style={card}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: '-0.03em' }}>
            Nexus ERP
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Yangi biznes ro'yxatdan o'tkazish</p>
        </div>

        {/* Error */}
        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label className="form-label">Kompaniya / Do'kon nomi</label>
            <input
              className="input-field"
              placeholder="Masalan: Baraka Savdo"
              value={form.storeName}
              onChange={e => set('storeName', e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="form-label">Biznes egasining ismi</label>
            <input
              className="input-field"
              placeholder="Masalan: Alisher Karimov"
              value={form.adminName}
              onChange={e => set('adminName', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Telefon raqam</label>
            <input
              className="input-field"
              placeholder="+998 90 123 45 67"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              type="tel"
            />
          </div>

          <div>
            <label className="form-label">Parol</label>
            <input
              className="input-field"
              placeholder="Kamida 6 ta belgi"
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ height: '44px', marginTop: '0.25rem' }}
          >
            {loading ? 'Kuting...' : "Ro'yxatdan o'tish va kirish"}
          </button>
        </form>

        {/* Footer link */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Allaqachon hisobingiz bormi?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Tizimga kirish
          </Link>
        </div>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--background)',
  padding: '1.5rem',
};

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  padding: '2rem',
};

const errorBox: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
  color: 'var(--danger)',
  border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
  padding: '0.7rem 1rem',
  borderRadius: 'var(--radius)',
  fontSize: '0.875rem',
  marginBottom: '0.25rem',
};
