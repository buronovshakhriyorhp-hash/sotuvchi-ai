import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, CheckCircle2, Clock, Eye,
  Filter, Download, Settings2, X, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import NewSaleModal from '../../components/NewSaleModal';
import useCurrency from '../../store/useCurrency';
import useToast from '../../store/useToast';
import { Sale, Customer, User } from '../../types';

// Extend Sale for UI specific fields if needed
interface SalesListItem extends Sale {
  receiptNo: string;
  debtAmount: number;
  cashAmount: number;
  cardAmount: number;
  bankAmount: number;
  discountAmt: number;
  note?: string;
  cashier?: User; // Keeping it as it might be in the API response
}

interface Column {
  key: string;
  label: string;
  align: 'left' | 'right' | 'center';
  default: boolean;
}

// ===== 22 TA USTUN KONFIGURATSIYASI =====
const ALL_COLUMNS: Column[] = [
  { key: 'index', label: '#', align: 'left', default: true },
  { key: 'customer', label: 'Mijoz', align: 'left', default: true },
  { key: 'receiptNo', label: 'Sotuv', align: 'left', default: true },
  { key: 'status', label: 'Sotuv holati', align: 'left', default: true },
  { key: 'paymentStatus', label: "To'lov holati", align: 'left', default: true },
  { key: 'staff', label: "Mas'ul xodim", align: 'left', default: true },
  { key: 'total', label: 'Jami narxi', align: 'right', default: true },
  { key: 'productImage', label: 'Mahsulot rasmi', align: 'center', default: false },
  { key: 'payment', label: "To'lov", align: 'right', default: true },
  { key: 'cash', label: "Naqd to'lov", align: 'right', default: true },
  { key: 'card', label: "Bank kartasi orqali to'lov", align: 'right', default: true },
  { key: 'bankTransfer', label: "Bank o'tkazmasi orqali to'lov", align: 'right', default: false },
  { key: 'humo', label: "Humo kartasi orqali to'lov", align: 'right', default: false },
  { key: 'otherPayment', label: "Boshqa usullar bilan to'lov", align: 'right', default: false },
  { key: 'debt', label: 'Qarzga', align: 'right', default: true },
  { key: 'discount', label: 'Chegirma', align: 'right', default: true },
  { key: 'loyaltyExpense', label: "Sodiqlik kartasi bo'yicha xarajatlar", align: 'right', default: false },
  { key: 'loyaltyTransfer', label: "Sodiqlik kartasi uchun o'tkazma", align: 'right', default: false },
  { key: 'seller', label: 'Sotuvchi', align: 'left', default: true },
  { key: 'note', label: "Ma'lumot", align: 'left', default: true },
  { key: 'saleType', label: 'Sotuv turi', align: 'left', default: false },
  { key: 'createdAt', label: 'Sotilgan vaqti', align: 'right', default: true },
];

const STORAGE_KEY = 'nexus_sales_columns';

function getInitialColumns(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ALL_COLUMNS.filter(c => c.default).map(c => c.key);
}

interface ColumnSettingsProps {
  visibleColumns: string[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
}

// ===== COLUMN SETTINGS PANEL =====
function ColumnSettingsPanel({ visibleColumns, setVisibleColumns, onClose }: ColumnSettingsProps) {
  const toggle = (key: string) => {
    setVisibleColumns(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const selectAll = () => {
    const all = ALL_COLUMNS.map(c => c.key);
    setVisibleColumns(all);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  };

  const resetAll = () => {
    const def = ALL_COLUMNS.filter(c => c.default).map(c => c.key);
    setVisibleColumns(def);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
  };

  const activeCount = visibleColumns.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-md" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>Jadval sozlamalari</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeCount} / {ALL_COLUMNS.length} ustun ko'rsatilmoqda</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: 0 }}>
          {/* Action bar */}
          <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ustunni o'chirish / yoqish</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={selectAll}>Hammasini yoqish</button>
              <button className="btn btn-ghost btn-sm" onClick={resetAll} style={{ color: 'var(--primary-dark)' }}>
                <RefreshCw size={12}/> Standart
              </button>
            </div>
          </div>
          
          {/* Columns list */}
          <div style={{ padding: '0.5rem 1.5rem', maxHeight: 450, overflowY: 'auto' }}>
            {ALL_COLUMNS.map(col => {
              const isOn = visibleColumns.includes(col.key);
              return (
                <div key={col.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 500, color: isOn ? 'var(--text)' : 'var(--text-muted)', fontSize: '0.875rem' }}>{col.label}</span>
                  <div 
                    onClick={() => toggle(col.key)}
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: isOn ? 'var(--primary)' : 'var(--border-strong)',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, left: isOn ? 20 : 2,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: 0 }}>
          {/* Action bar */}
          <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ustunni o'chirish / yoqish</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={selectAll}>Hammasini yoqish</button>
              <button className="btn btn-ghost btn-sm" onClick={resetAll} style={{ color: 'var(--primary-dark)' }}>
                <RefreshCw size={12}/> Standart
              </button>
            </div>
          </div>
          
          {/* Columns list */}
          <div style={{ padding: '0.5rem 1.5rem', maxHeight: 450, overflowY: 'auto' }}>
            {ALL_COLUMNS.map(col => {
              const isOn = visibleColumns.includes(col.key);
              return (
                <div key={col.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 500, color: isOn ? 'var(--text)' : 'var(--text-muted)', fontSize: '0.875rem' }}>{col.label}</span>
                  <div 
                    onClick={() => toggle(col.key)}
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: isOn ? 'var(--primary)' : 'var(--border-strong)',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, left: isOn ? 20 : 2,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Yopish</button>
        </div>
      </div>
    </div>
  );
}

interface CellValueProps {
  col: Column;
  sale: SalesListItem;
  idx: number;
  format: (n: number) => string;
  formatDate: (d: any) => string;
}

// ===== CELL RENDERER =====
function CellValue({ col, sale, idx, format, formatDate }: CellValueProps) {
  switch (col.key) {
    case 'index': return <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{idx + 1}</span>;
    case 'customer': return sale.customer?.name 
      ? <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>{sale.customer.name}</span>
      : <span style={{ color: 'var(--text-muted)' }}>Chakana mijoz</span>;
    case 'receiptNo': return <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>#{sale.receiptNo}</span>;
    case 'status': {
      const st = sale.status || 'COMPLETED';
      return <span className={`badge ${st === 'COMPLETED' ? 'badge-active' : st === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
        {st === 'COMPLETED' ? <><CheckCircle2 size={10}/> Yakunlangan</> : st === 'CANCELLED' ? 'Bekor' : <><Clock size={10}/> Kutilmoqda</>}
      </span>;
    }
    case 'paymentStatus': return <span className={`badge ${sale.debtAmount > 0 ? 'badge-warning' : 'badge-active'}`} style={{ fontSize: '0.7rem' }}>
      {sale.debtAmount > 0 ? 'Qisman' : "To'liq"}
    </span>;
    case 'staff': return <span style={{ color: 'var(--text-secondary)' }}>{sale.cashier?.name || sale.user?.name || '-'}</span>;
    case 'total': return <span style={{ fontWeight: 800, color: 'var(--success)' }}>{format(sale.totalAmount || 0)}</span>;
    case 'productImage': return <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <Eye size={14} color="var(--text-muted)" />
    </div>;
    case 'payment': return <span style={{ fontWeight: 700 }}>{format(sale.totalAmount || 0)}</span>;
    case 'cash': return <span style={{ color: '#16a34a' }}>{format(sale.cashAmount || 0)}</span>;
    case 'card': return <span style={{ color: '#0284c7' }}>{format(sale.cardAmount || 0)}</span>;
    case 'bankTransfer': return <span style={{ color: 'var(--text-muted)' }}>{format(sale.bankAmount || 0)}</span>;
    case 'humo': return <span style={{ color: 'var(--text-muted)' }}>0</span>;
    case 'otherPayment': return <span style={{ color: 'var(--text-muted)' }}>0</span>;
    case 'debt': return <span style={{ color: sale.debtAmount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: sale.debtAmount > 0 ? 700 : 400 }}>{format(sale.debtAmount || 0)}</span>;
    case 'discount': return <span style={{ color: 'var(--text-muted)' }}>{format(sale.discountAmt || 0)}</span>;
    case 'loyaltyExpense': return <span style={{ color: 'var(--text-muted)' }}>0</span>;
    case 'loyaltyTransfer': return <span style={{ color: 'var(--text-muted)' }}>0</span>;
    case 'seller': return <span style={{ color: 'var(--text-secondary)' }}>{sale.cashier?.name || sale.user?.name || '-'}</span>;
    case 'note': return <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{sale.note || '-'}</span>;
    case 'saleType': return <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Savdo</span>;
    case 'createdAt': return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatDate(sale.createdAt)}</span>;
    default: return '-';
  }
}

// ===== MAIN COMPONENT =====
export default function SalesList() {
  const toast = useToast();
  const navigate = useNavigate();
  const { format } = useCurrency();

  const [sales, setSales] = useState<SalesListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getInitialColumns);
  const [perPage, setPerPage] = useState(10);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  useEffect(() => { fetchSales(); }, [fromDate, toDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/sales', { params: { from: fromDate, to: toDate, limit: 1000 } });
      setSales(res?.sales || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sales.filter(s => {
    const matchSearch = String(s.receiptNo).toLowerCase().includes(search.toLowerCase()) ||
                        (s.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (s.cashier?.name || '').toLowerCase().includes(search.toLowerCase());
    const statusVal = s.status || 'COMPLETED';
    const matchStatus = statusFilter === 'all' || statusVal === statusFilter;
    return matchSearch && matchStatus;
  });

  const displayed = filtered.slice(0, perPage);

  const totalRevenue = filtered.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const totalPaid = filtered.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const totalCash = filtered.reduce((a, b) => a + (b.cashAmount || 0), 0);
  const totalCard = filtered.reduce((a, b) => a + (b.cardAmount || 0), 0);
  const totalDebt = filtered.reduce((a, b) => a + (b.debtAmount || 0), 0);
  const totalDiscount = filtered.reduce((a, b) => a + (b.discountAmt || 0), 0);

  const formatDate = (d: any) => {
    return new Date(d).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleExcel = () => {
    if (filtered.length === 0) {
      toast.warning('Eksport qilish uchun ma\'lumot yo\'q!');
      return;
    }

    const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));
    const headers = activeColumns.map(c => c.label);
    const rows = filtered.map((s, i) => activeColumns.map(col => {
      switch (col.key) {
        case 'index': return i + 1;
        case 'customer': return s.customer?.name || 'Chakana';
        case 'receiptNo': return s.receiptNo || '';
        case 'status': return s.status === 'COMPLETED' ? 'Yakunlangan' : s.status === 'CANCELLED' ? 'Bekor' : 'Kutilmoqda';
        case 'paymentStatus': return s.debtAmount > 0 ? 'Qisman' : "To'liq";
        case 'staff': return s.cashier?.name || s.user?.name || '-';
        case 'total': return s.totalAmount || 0;
        case 'payment': return s.totalAmount || 0;
        case 'cash': return s.cashAmount || 0;
        case 'card': return s.cardAmount || 0;
        case 'bankTransfer': return s.bankAmount || 0;
        case 'debt': return s.debtAmount || 0;
        case 'discount': return s.discountAmt || 0;
        case 'seller': return s.cashier?.name || '-';
        case 'note': return s.note || '-';
        case 'saleType': return 'Savdo';
        case 'createdAt': return s.createdAt ? new Date(s.createdAt).toLocaleString('uz-UZ') : '';
        default: return '0';
      }
    }));
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sotuvlar_${fromDate}_${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Sotuvlar ro'yxati</h1>
          <p className="page-subtitle">{filtered.length} ta sotuv · Bugun: {new Date().toLocaleDateString('uz-UZ')}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => navigate('/pos')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f3e8ff', borderColor: '#a855f7', color: '#7c3aed', fontWeight: 700 }}>
            🛒 Chakana savdo
          </button>
          <button className="btn btn-success" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Yangi sotuv
          </button>
          <button className="btn btn-outline" onClick={handleExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={15} /> Excel
          </button>
        </div>
      </div>
      {/* Stats Ribbon */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card stat-card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>JAMI TUSHUM</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--primary-dark)' }}>{format(totalRevenue)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{filtered.length} ta sotuvdan</div>
        </div>
        <div className="card stat-card" style={{ padding: '1rem', borderLeft: '4px solid #16a34a' }}>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>NAQD PUL</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', color: '#16a34a' }}>{format(totalCash)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{Math.round(totalCash/totalRevenue*100 || 0)}% ulush</div>
        </div>
        <div className="card stat-card" style={{ padding: '1rem', borderLeft: '4px solid #0284c7' }}>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>PLASTIK / BANK</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', color: '#0284c7' }}>{format(totalCard + filtered.reduce((a, b) => a + (b.bankAmount || 0), 0))}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Terminal va o'tkazmalar</div>
        </div>
        <div className="card stat-card" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>QARZDORLIK</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--danger)' }}>{format(totalDebt)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>To'lanmagan qoldiq</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface)' }}>
          <div className="search-input-wrap" style={{ flex: '1 1 240px', maxWidth: '100%' }}>
            <Search size={15} className="input-icon" />
            <input className="input-field" placeholder="Karta raqami, mijoz yoki xodim..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="date" className="input-field" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: 135, fontSize: '0.8rem' }} />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input type="date" className="input-field" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: 135, fontSize: '0.8rem' }} />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFromDate(todayStr); setToDate(todayStr); }} title="Bugun">Bugun</button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: window.innerWidth > 768 ? 'auto' : '0' }}>
            <select className="input-field" style={{ width: 85, height: 36, padding: '0 0.5rem', fontSize: '0.8rem' }} value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
              <option value={10}>10 ta</option>
              <option value={25}>25 ta</option>
              <option value={50}>50 ta</option>
              <option value={100}>100 ta</option>
            </select>
            <button 
              className="btn btn-outline btn-icon" 
              title="Jadval sozlamalari"
              onClick={() => setShowColumnSettings(true)}
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>

        {/* Dinamik jadval */}
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ fontSize: '0.8125rem', minWidth: activeColumns.length * 110 }}>
            <thead>
              <tr>
                {activeColumns.map(col => (
                  <th key={col.key} style={{ textAlign: col.align, cursor: col.key === 'createdAt' ? 'pointer' : 'default' }}>
                    {col.key === 'createdAt' ? `↓ ${col.label}` : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={activeColumns.length}><div className="table-empty">Yuklanmoqda...</div></td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={activeColumns.length}><div className="table-empty">Ma'lumotlar mavjud emas</div></td></tr>
              ) : displayed.map((s, idx) => (
                <tr key={s.id}>
                  {activeColumns.map(col => (
                    <td key={col.key} style={{ textAlign: col.align }}>
                      <CellValue col={col} sale={s} idx={idx} format={format} formatDate={formatDate} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom summary */}
        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>Jami narxi: </span>
              <b>{format(totalRevenue)}</b>
            </span>
            <span style={{ fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>To'lov: </span>
              <b>{format(totalPaid)}</b>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>Naqd: </span><b>{format(totalCash)}</b>
            </span>
            <span style={{ fontSize: '0.8125rem' }}>
              <span style={{ color: '#0284c7', fontWeight: 700 }}>Karta: </span><b>{format(totalCard)}</b>
            </span>
            <span style={{ fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Qarz: </span><b>{format(totalDebt)}</b>
            </span>
            <span style={{ fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Chegirma: </span><b>{format(totalDiscount)}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Column Settings Panel */}
      {showColumnSettings && (
        <ColumnSettingsPanel
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onClose={() => setShowColumnSettings(false)}
        />
      )}

      {/* New Sale Modal */}
      {showModal && (
        <NewSaleModal
          onClose={() => setShowModal(false)}
          onSaved={() => { fetchSales(); setShowModal(false); }}
        />
      )}
    </div>
  );
}
