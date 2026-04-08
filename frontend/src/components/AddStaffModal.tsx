import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, User, Phone, ShieldCheck, Lock, Check, Loader2 } from 'lucide-react';

export default function AddStaffModal({ onClose, onSaved, editStaff }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '+998',
    password: '',
    role: 'CASHIER',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editStaff) {
      setFormData({
        name: editStaff.name || '',
        phone: editStaff.phone || '+998',
        password: '',
        role: editStaff.role || 'CASHIER',
        isActive: editStaff.isActive ?? true
      });
    }
  }, [editStaff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editStaff) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await api.put(`/staff/${editStaff.id}`, updateData);
      } else {
        await api.post('/staff', formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ 
      backdropFilter: 'blur(8px)', 
      background: 'rgba(15, 23, 42, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div 
        className="modal-content animate-in" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '480px', 
          width: '95%',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '2rem 2rem 1.5rem', 
          background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          borderBottom: '1px solid var(--border)',
          position: 'relative'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {editStaff ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Tizimga yangi xodim qo'shish va unga kerakli vakolatlarni biriktirish.
          </p>
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={onClose} 
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', borderRadius: '12px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Ism va Familiya */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>F.I.SH (Ism va familiya)</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input-field"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masalan: Alisher Valiyev"
                  style={{ paddingLeft: '3rem', height: '52px', borderRadius: '14px', border: '2px solid var(--border)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Telefon */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Telefon raqam</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input-field"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998"
                    style={{ paddingLeft: '3rem', height: '52px', borderRadius: '14px', border: '2px solid var(--border)' }}
                  />
                </div>
              </div>

              {/* Lavozim */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Lavozim</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    style={{ paddingLeft: '3rem', height: '52px', borderRadius: '14px', border: '2px solid var(--border)', appearance: 'none' }}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Menejer</option>
                    <option value="CASHIER">Kassir</option>
                    <option value="STOREKEEPER">Omborchi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Parol */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {editStaff ? "Yangi parol (ixtiyoriy)" : "Parol"}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  required={!editStaff}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Kamida 4 ta belgi"
                  style={{ paddingLeft: '3rem', height: '52px', borderRadius: '14px', border: '2px solid var(--border)' }}
                />
              </div>
            </div>

            {editStaff && (
              <div 
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', 
                  padding: '1rem', background: '#f8fafc', borderRadius: '14px',
                  cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)'
                }}
              >
                <div style={{ 
                  width: '20px', height: '20px', borderRadius: '6px', 
                  border: `2px solid ${formData.isActive ? 'var(--primary)' : 'var(--border-strong)'}`,
                  background: formData.isActive ? 'var(--primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                }}>
                  {formData.isActive && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
                <label style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Faol holatda (Tizimga kirishga ruxsat)</label>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ flex: 1, height: '52px', borderRadius: '14px', fontWeight: 700 }} 
              onClick={onClose}
            >
              Bekor qilish
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary" 
              style={{ 
                flex: 1, height: '52px', borderRadius: '14px', fontWeight: 700,
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (editStaff ? 'O\'zgarishlarni saqlash' : 'Xodimni qo\'shish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
