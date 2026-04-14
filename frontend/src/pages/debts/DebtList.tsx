import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Plus, PhoneCall, Search } from 'lucide-react';
import api from '../../api/axios';
import useCurrency from '../../store/useCurrency';
import useToast from '../../store/useToast';
import { Customer, Supplier } from '../../types';
import NewDebtModal from '../../components/NewDebtModal';
import DebtPaymentModal from '../../components/DebtPaymentModal';
import DebtHistoryModal from '../../components/DebtHistoryModal';

interface Debt {
  id: number | string;
  type: 'customer' | 'supplier';
  customerId?: number;
  supplierId?: number;
  customer?: Customer;
  supplier?: Supplier;
  amount: number;
  paidAmount: number;
  remaining: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid';
  isOverdue: boolean;
  createdAt: string;
}

interface DebtSummary {
  totalPending: number;
  overdueCount: number;
  paidCount: number;
}

export default function DebtList() {
  const toast = useToast();
  const { format } = useCurrency();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary>({ totalPending: 0, overdueCount: 0, paidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);
  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null);

  useEffect(() => {
    fetchDebts();
  }, [typeFilter]);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const [debtRes, sumRes] = await Promise.all([
        api.get<any>('/debts', { params: { type: typeFilter === 'all' ? undefined : typeFilter } }),
        api.get<any>('/debts/summary').catch(() => null),
      ]);
      const list = Array.isArray(debtRes) ? debtRes : (debtRes?.debts || debtRes?.data || []);
      setDebts(list);
      setSummary(sumRes || { totalPending: 0, overdueCount: 0, paidCount: 0 });
    } catch (err) {
      console.error('DebtList error:', err);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = debts.filter(d => {
    const name = d.type === 'customer' ? d.customer?.name : d.supplier?.name;
    const matchSearch = String(name || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // markPaid and prompt removed, handled by DebtPaymentModal now


  const statusBadge = (d: Debt) => {
    if (d.status === 'paid')    return <span className="badge badge-active"><CheckCircle2 size={10}/> To'landi</span>;
    if (d.isOverdue)            return <span className="badge badge-danger"><AlertCircle size={10}/> Muddati o'tgan</span>;
    if (d.status === 'partial') return <span className="badge badge-info"><Clock size={10}/> Qisman</span>;
    return <span className="badge badge-warning"><Clock size={10}/> Kutmoqda</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Qarzlar boshqaruvi</h1>
          <p className="page-subtitle">Mijozlar va yetkazuvchilar qarzi</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditDebt(null); setShowModal(true); }} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><Plus size={16}/> Yangi qarz</button>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'1.25rem' }}>
        <div className="card" style={{ padding:'1rem 1.5rem', borderLeft:'4px solid var(--danger)' }}>
          <div className="stat-label">Jami qolgan qarz</div>
          <div className="stat-value" style={{ fontSize:'1.5rem', color:'var(--danger)' }}>{format(summary.totalPending)}</div>
        </div>
        <div className="card" style={{ padding:'1rem 1.5rem', borderLeft:'4px solid var(--warning)' }}>
          <div className="stat-label">Muddati o'tgan</div>
          <div className="stat-value" style={{ fontSize:'1.5rem', color:'var(--warning)' }}>{summary.overdueCount} ta</div>
        </div>
        <div className="card" style={{ padding:'1rem 1.5rem', borderLeft:'4px solid var(--success)' }}>
          <div className="stat-label">To'liq to'langan</div>
          <div className="stat-value" style={{ fontSize:'1.5rem', color:'var(--success)' }}>{summary.paidCount} ta</div>
        </div>
      </div>

      {/* Overdue alert */}
      {summary.overdueCount > 0 && (
        <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:'var(--radius)', padding:'0.875rem 1.25rem', marginBottom:'1.25rem', display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <AlertCircle size={18} color="var(--danger)" style={{ flexShrink:0 }}/>
          <span style={{ fontSize:'0.875rem', color:'var(--danger)', fontWeight:600 }}>
            {summary.overdueCount} ta qarzning muddati o'tib ketgan! Zudlik bilan bog'laning.
          </span>
        </div>
      )}

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <div className="search-input-wrap">
            <Search size={15} className="input-icon"/>
            <input className="input-field" placeholder="Ism bo'yicha qidirish..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:'2.5rem' }}/>
          </div>
          <div style={{ display:'flex', gap:'0.375rem' }}>
            {[['all','Barchasi'],['customer','Mijozlar'],['supplier','Yetkazuvchilar']].map(([v,l])=>(
              <button key={v} onClick={()=>setTypeFilter(v)} className={`btn btn-sm ${typeFilter===v?'btn-primary':'btn-outline'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="table-wrapper" style={{ border:'none', borderRadius:0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th>ID</th><th>Ism</th><th>Turi</th><th>Telefon</th>
                <th style={{ textAlign:'right' }}>Qolgan miqdor</th>
                <th>Muddat</th><th>Holat</th><th style={{ textAlign:'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={8}><div className="table-empty">Yuklanmoqda...</div></td></tr>
              ) : filtered.length === 0 ? (
                 <tr><td colSpan={8}><div className="table-empty">Qarz topilmadi</div></td></tr>
              ) : filtered.map((d)=>(
                <tr key={d.id} style={{ opacity: d.status==='paid'?0.6:1 }}>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>D-{d.id}</td>
                  <td style={{ fontWeight:600 }}>{d.type==='customer' ? d.customer?.name : d.supplier?.name}</td>
                  <td><span className={`badge ${d.type==='customer'?'badge-info':'badge-neutral'}`}>{d.type==='customer'?'Mijoz':'Yetkazuvchi'}</span></td>
                  <td>
                    { (d.type==='customer' ? d.customer?.phone : d.supplier?.phone) ? (
                      <a href={`tel:${d.type==='customer' ? d.customer?.phone : d.supplier?.phone}`} style={{ display:'flex', alignItems:'center', gap:'0.375rem', color:'var(--primary-dark)', fontWeight:500, textDecoration:'none', fontSize:'0.8rem' }}>
                        <PhoneCall size={12}/>{d.type==='customer' ? d.customer?.phone : d.supplier?.phone}
                      </a>
                    ) : '-' }
                  </td>
                  <td style={{ textAlign:'right', fontWeight:700, color: d.status==='paid'?'var(--success)':'var(--danger)' }}>
                    {format(d.remaining)}
                    {d.paidAmount > 0 && d.status !== 'paid' && <div style={{ fontSize:'0.7rem', color:'var(--success)', fontWeight:400 }}>To'langan: {format(d.paidAmount)}</div>}
                  </td>
                  <td style={{ fontSize:'0.8125rem', color: d.isOverdue?'var(--danger)':'var(--text-muted)', fontWeight: d.isOverdue?700:400 }}>
                    {new Date(d.dueDate).toLocaleDateString('uz-UZ')}
                  </td>
                  <td>{statusBadge(d)}</td>
                  <td style={{ textAlign:'right', display:'flex', gap:'0.3rem', justifyContent:'flex-end' }}>
                    <button onClick={() => setHistoryDebt(d)} className="btn btn-outline btn-sm" style={{ color:'var(--primary)' }}>
                      Tarix & Izohlar
                    </button>
                    {d.status !== 'paid' && (
                      <button onClick={() => setPayDebt(d)} className="btn btn-success btn-sm">
                        <CheckCircle2 size={13}/> To'lash
                      </button>
                    )}
                    <button onClick={() => { setEditDebt(d); setShowModal(true); }} className="btn btn-outline btn-sm">
                      Tahrirlash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <NewDebtModal
          editData={editDebt}
          onClose={() => { setShowModal(false); setEditDebt(null); }}
          onSuccess={() => {
            setShowModal(false);
            setEditDebt(null);
            fetchDebts();
          }}
        />
      )}

      {payDebt && (
        <DebtPaymentModal
          debt={payDebt}
          onClose={() => setPayDebt(null)}
          onSuccess={() => {
            setPayDebt(null);
            fetchDebts();
          }}
        />
      )}
      {historyDebt && (
        <DebtHistoryModal
          debt={historyDebt}
          onClose={() => setHistoryDebt(null)}
        />
      )}
    </div>
  );
}
