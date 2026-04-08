import React, { useState } from 'react';
import useAuth from '../store/useAuth';

export default function Login() {
  const [phone, setPhone] = useState('+998941009122');
  const [password, setPassword] = useState('@gumsmass645');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuth(s => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err) {
      setError(err);
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

        {error && <div style={{ background:'var(--danger)', color:'#fff', padding:'0.75rem', borderRadius:'var(--radius)', marginBottom:'1.5rem', fontSize:'0.875rem', textAlign:'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div>
            <label className="form-label">Telefon raqam</label>
            <input className="input-field" value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="+998" />
          </div>
          <div>
            <label className="form-label">Parol</label>
            <input className="input-field" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height:'44px', marginTop:'0.5rem' }}>
            {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
          <div>Demo: +998941009122 / @gumsmass645</div>
        </div>
      </div>
    </div>
  );
}
