import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, Clock, User, Info } from 'lucide-react';
import api from '../../api/axios';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ action: '', entityType: '' });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit', { params: { page, limit: 50, ...filter } });
      setLogs(res?.logs || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return 'var(--danger)';
    if (action.includes('UPDATE')) return 'var(--warning)';
    if (action.includes('CREATE')) return 'var(--success)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Tizim Auditi (Xavfsizlik)</h1>
          <p className="page-subtitle">Barcha o'zgarishlar va o'chirishlar monitoringi</p>
        </div>
        <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
          <Shield size={24} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="input-field" 
            style={{ maxWidth: '200px' }}
            value={filter.action}
            onChange={e => setFilter({ ...filter, action: e.target.value })}
          >
            <option value="">Barcha amallar</option>
            <option value="DELETE_SALE">Sotuvni o'chirish</option>
            <option value="UPDATE_PRODUCT">Mahsulotni tahrirlash</option>
            <option value="CREATE_EXPENSE">Xarajat kiritish</option>
            <option value="DELETE_EXPENSE">Xarajat o'chirish</option>
          </select>
          <select 
            className="input-field" 
            style={{ maxWidth: '200px' }}
            value={filter.entityType}
            onChange={e => setFilter({ ...filter, entityType: e.target.value })}
          >
            <option value="">Barcha turlar</option>
            <option value="Sale">Sotuvlar</option>
            <option value="Product">Mahsulotlar</option>
            <option value="Expense">Xarajatlar</option>
          </select>
          <p style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Jami: {total} log</p>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Foydalanuvchi</th>
                <th>Amal</th>
                <th>Tur</th>
                <th>ID</th>
                <th>Izoh</th>
                <th style={{ textAlign: 'right' }}>Batafsil</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Yuklanmoqda...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Audit loglari topilmadi</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 500 }}>{log.user?.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({log.user?.role})</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.75rem', 
                      color: getActionColor(log.action),
                      letterSpacing: '0.02em'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entityType}</td>
                  <td style={{ color: 'var(--text-muted)' }}>#{log.entityId}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.note || '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Log ma'lumotlari">
                      <Info size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
