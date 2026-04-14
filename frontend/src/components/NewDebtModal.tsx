import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Users, Briefcase, Plus, FileText, Clock } from 'lucide-react';
import api from '../api/axios';
import useToast from '../store/useToast';
import useCurrency from '../store/useCurrency';
import SearchableSelect from './SearchableSelect';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function NewDebtModal({ onClose, onSuccess, editData }: Props) {
  const toast = useToast();
  const { format } = useCurrency();
  const [type, setType] = useState('customer');
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDateDisplay, setDueDateDisplay] = useState(() => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  });
  const [note, setNote] = useState('');
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Yangi kontakt qo'shish
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const updateDateShortcut = (d: Date) => {
    setDueDate(d.toISOString().split('T')[0]);
    setDueDateDisplay(`${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, '');
    if (val.length > 2) val = val.slice(0, 2) + '.' + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + '.' + val.slice(5, 9);
    setDueDateDisplay(val);
    if (val.length === 10) {
      const [dd, mm, yyyy] = val.split('.');
      if (dd && mm && yyyy) setDueDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  useEffect(() => {
    if (editData) {
      setType(editData.type);
      if (editData.type === 'customer') setCustomerId(editData.customerId?.toString() || '');
      if (editData.type === 'supplier') setSupplierId(editData.supplierId?.toString() || '');
      setAmount(editData.amount?.toString() || '');
      if (editData.dueDate) setDueDate(new Date(editData.dueDate).toISOString().split('T')[0]);
      if (editData.note) setNote(editData.note);
    }
  }, [editData]);

  useEffect(() => {
    fetchContacts();
  }, [type]);

  const fetchContacts = () => {
    if (type === 'customer') {
      api.get('/customers').then(res => setCustomers(Array.isArray(res) ? res : (res as any).customers || []));
    } else {
      api.get('/suppliers').then(res => setSuppliers(Array.isArray(res) ? res : (res as any).data || (res as any).suppliers || []));
    }
  };

  const now = new Date();
  const currentDateTimeStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const handleAddContact = async () => {
    if (!newContactName.trim()) return toast.error("Ism kiritish majburiy");
    try {
      if (type === 'customer') {
        const res = await api.post('/customers', { name: newContactName, phone: newContactPhone });
        const c = (res as any).data || res;
        setCustomers(prev => [...prev, c]);
        setCustomerId(c.id.toString());
      } else {
        const res = await api.post('/suppliers', { name: newContactName, phone: newContactPhone });
        const s = (res as any).data || res;
        setSuppliers(prev => [...prev, s]);
        setSupplierId(s.id.toString());
      }
      setShowAddContact(false);
      setNewContactName('');
      setNewContactPhone('');
      toast.success("Muvaffaqiyatli saqlandi");
    } catch {
      toast.error("Kontakt qo'shishda xatolik");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error("Summani to'g'ri kiriting");
    if (!dueDate) return toast.error("Muddatni kiriting");
    if (type === 'customer' && !customerId) return toast.error("Mijozni tanlang");
    if (type === 'supplier' && !supplierId) return toast.error("Yetkazuvchini tanlang");

    setLoading(true);
    try {
      const payload = {
        type,
        customerId: type === 'customer' ? Number(customerId) : null,
        supplierId: type === 'supplier' ? Number(supplierId) : null,
        amount: Number(amount),
        dueDate: new Date(dueDate).toISOString(),
        ...(note.trim() ? { note: note.trim() } : {})
      };

      if (editData?.id) {
        await api.put(`/debts/${editData.id}`, payload);
        toast.success("Qarz muvaffaqiyatli tahrirlandi");
      } else {
        await api.post('/debts', payload);
        toast.success("Qarz muvaffaqiyatli qo'shildi");
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content fade-in" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 500, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {editData ? "Qarzni tahrirlash" : "Yangi qarz qo'shish"}
            </h2>
            <p style={{ margin:0, marginTop:'0.25rem', fontSize:'0.8125rem', color:'var(--text-muted)' }}>Mijoz yoki yetkazuvchi qarzini boshqarish</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
            
            {/* Ma'lumot Uchun */}
            {!editData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-2)', padding: '0.6rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                <Clock size={16} /> Ushbu qarz <strong>{currentDateTimeStr}</strong> da qo'shilmoqda
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><Briefcase size={16}/> Qarz turi</label>
              <select className="input-field" value={type} onChange={e => { setType(e.target.value); setCustomerId(''); setSupplierId(''); setShowAddContact(false); }}>
                <option value="customer">Mijozlardan qarz (Ular bizga beradilar)</option>
                <option value="supplier">Yetkazuvchiga qarz (Biz ularga beramiz)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <Users size={16}/> {type === 'customer' ? 'Mijoz' : 'Yetkazuvchi'}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                {showAddContact ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                     <input className="input-field" placeholder="Ismi/Nomi" value={newContactName} onChange={e => setNewContactName(e.target.value)} autoFocus />
                     <input className="input-field" placeholder="Telefon raqami (ixtiyoriy)" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} />
                     <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <button type="button" className="btn btn-primary btn-sm" onClick={handleAddContact}>Saqlash</button>
                       <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddContact(false)}>Bekor qilish</button>
                     </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <SearchableSelect
                        options={type === 'customer' ? customers : suppliers}
                        value={type === 'customer' ? customerId : supplierId}
                        onChange={val => type === 'customer' ? setCustomerId(val) : setSupplierId(val)}
                        placeholder="Izlash yoki tanlash..."
                        labelKey="name"
                        valueKey="id"
                        renderOption={(opt) => (
                          <div style={{ display:'flex', flexDirection:'column' }}>
                            <span style={{ fontWeight: 600 }}>{opt.name}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{opt.phone || 'Tel yoq'}</span>
                          </div>
                        )}
                      />
                    </div>
                    <button type="button" className="btn btn-outline btn-icon" onClick={() => setShowAddContact(true)} title="Yangi qo'shish"><Plus size={18} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><DollarSign size={16}/> Qarz Summasi</label>
              <div className="search-input-wrap">
                <span className="input-icon" style={{ color:'var(--text-muted)', fontWeight:700 }}>UZS</span>
                <input 
                  type="number" className="input-field" 
                  value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="any"
                  style={{ paddingLeft:'3.5rem', fontWeight:800, fontSize:'1.2rem', color: amount ? 'var(--danger)' : 'inherit', height: '48px' }} 
                  placeholder="0"
                />
              </div>
              {amount && Number(amount) > 0 && <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Jami: {format(Number(amount))} Kiritilishi ko'zda tutilmoqda</div>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:'0.5rem', justifyContent: 'space-between' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><Calendar size={16}/> Qaytarish yoki Yopish muddati</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Kun.Oy.Yil)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={dueDateDisplay} 
                  onChange={handleDateChange} 
                  placeholder="Masalan: 31.12.2026" 
                  required 
                  style={{ width: '100%', height: '48px', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.05em' }} 
                />
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => updateDateShortcut(new Date())}>Bugun</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 7); updateDateShortcut(d);
                  }}>+1 Hafta</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => {
                    const d = new Date(); d.setMonth(d.getMonth() + 1); updateDateShortcut(d);
                  }}>+1 Oy</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => {
                    const d = new Date(); d.setFullYear(d.getFullYear() + 1); updateDateShortcut(d);
                  }}>+1 Yil</button>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
               <label className="form-label" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><FileText size={16}/> Izoh qo'shish (ixtiyoriy)</label>
               <textarea className="input-field" rows={2} placeholder="Sabab, holat yoki olingan mahsulotlar ro'yxati..." value={note} onChange={e => setNote(e.target.value)} />
            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--surface)' }}>
            <button type="button" className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary" style={{ flex:1.5 }} disabled={loading}>
              {loading ? "Saqanyapti..." : "Qarzni Tasdiqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
