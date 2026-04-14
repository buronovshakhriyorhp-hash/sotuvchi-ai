import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Trash2, Calendar, Wallet, X } from 'lucide-react';
import api from '../../api/axios';
import useCurrency from '../../store/useCurrency';
import useToast from '../../store/useToast';
import { User } from '../../types';

interface Expense {
  id: number | string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  user?: User;
  createdAt: string;
}

export default function Expenses() {
  const toast = useToast();
  const { format } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ amount: '', category: 'Rent', description: '', date: new Date().toISOString().split('T')[0] });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/expenses');
      setExpenses(res?.expenses || []);
      setTotalAmount(res?.totalAmount || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      toast.success("Xarajat muvaffaqiyatli saqlandi");
      fetchExpenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err || 'Xatolik yuz berdi');
    }
  };


  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Xarajatni o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
      toast.success("Xarajat o'chirildi");
    } catch (err: any) {
      toast.error('Xatolik yuz berdi');
    }
  };


  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Xarajatlar</h1>
          <p className="page-subtitle">Umumiy sarf-xarajatlar nazorati</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} /> Yangi xarajat
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card stats-card">
          <div className="stats-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <Wallet size={20} />
          </div>
          <div className="stats-info">
            <p className="stats-label">Jami xarajatlar</p>
            <h3 className="stats-value" style={{ color: 'var(--danger)' }}>{format(totalAmount)}</h3>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Sana</th>
                <th>Toifa</th>
                <th>Izoh</th>
                <th>Kim kiritdi</th>
                <th style={{ textAlign: 'right' }}>Summa</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Yuklanmoqda...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty">Harajatlar topilmadi</div></td></tr>
              ) : expenses.map((ex, idx) => (
                <tr key={ex.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      {new Date(ex.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}>
                      {ex.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{ex.description || '-'}</td>
                  <td>{ex.user?.name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>{format(ex.amount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDelete(ex.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Yangi xarajat</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Summa</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Toifa</label>
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Rent">Ijara</option>
                    <option value="Salary">Maosh</option>
                    <option value="Utility">Kommunal</option>
                    <option value="Food">Oziq-ovqat</option>
                    <option value="Cargo">Kargo/Logistika</option>
                    <option value="Marketing">Reklama</option>
                    <option value="Other">Boshqa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sana</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Izoh</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Xarajat haqida qisqacha..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
