import React, { useState, useEffect } from 'react';
import { Users, Shield, Eye, Edit2, Trash2, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import AddStaffModal from '../../components/AddStaffModal';
import useToast from '../../store/useToast';
import { Staff } from '../../types';

const ROLES = {
  ADMIN:    { label:'Admin',    color:'#dc2626', bg:'#fee2e2' },
  MANAGER:  { label:'Menejer', color:'#9333ea', bg:'#f3e8ff' },
  CASHIER:  { label:'Kassir',  color:'#0284c7', bg:'#e0f2fe' },
  STOREKEEPER:{ label:'Omborchi',color:'#16a34a',bg:'#dcfce7' },
};

const MODULES = [
  'POS (Kassir)', 'Mahsulotlar', 'Ombor', 'Mijozlar', 
  'Yetkazuvchilar', 'Hisobotlar', 'Xodimlar', 'Qarzlar', 'Sozlamalar'
];

export default function StaffList() {
  const toast = useToast();
  const [tab, setTab] = useState('staff');

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [permsLoading, setPermsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    fetchStaff();
    fetchPermissions();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/staff');
      const list = Array.isArray(res) ? res : (res?.staff || res?.data || []);
      setStaff(list);
    } catch (err) {
      console.error('StaffList error:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermsLoading(true);
      const res = await api.get<any>('/permissions');
      const data = Array.isArray(res) ? res : (res?.data || []);
      const mapping: Record<string, Record<string, boolean>> = {};
      data.forEach((p: any) => {
        try {
          mapping[p.role] = JSON.parse(p.permissions);
        } catch { mapping[p.role] = {}; }
      });
      setRolePermissions(mapping);
    } catch (err) {
      console.error('Permissions fetch error:', err);
    } finally {
      setPermsLoading(false);
    }
  };

  const togglePermission = async (role: string, module: string) => {
    const currentPerms = rolePermissions[role] || {};
    const newPerms = { ...currentPerms, [module]: !currentPerms[module] };
    
    // Optimistic update
    setRolePermissions(prev => ({ ...prev, [role]: newPerms }));

    try {
      await api.put(`/permissions/${role}`, { permissions: JSON.stringify(newPerms) });
      toast.success(`${(ROLES as any)[role].label} vakolatlari saqlandi`);
    } catch (err) {
      toast.error('Vakolatni saqlashda xatolik yuz berdi');
      // Rollback
      setRolePermissions(prev => ({ ...prev, [role]: currentPerms }));
    }

  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Xodimni o\'chirib (nofaol qilib) qo\'ymoqchimisiz?')) {
      try {
        await api.put(`/staff/${id}`, { isActive: false });
        fetchStaff();
        toast.success("Xodim o'chirildi (nofaol qilindi)");
      } catch (err) {
        toast.error('Xatolik yuz berdi');
      }
    }
  };

  const handleSaved = () => {
    fetchStaff();
    toast.success("Ma'lumotlar saqlandi");
  };


  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Xodimlar boshqaruvi</h1>
          <p className="page-subtitle">Xodimlar va vakolatlar tizimi</p>
        </div>
        <button onClick={() => { setEditStaff(null); setShowAddModal(true); }} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Plus size={18}/> Yangi xodim
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6" style={{ display:'flex', gap:'0.5rem', borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem' }}>
        <button 
          onClick={()=>setTab('staff')} 
          className={`tab-btn ${tab==='staff'?'active':''}`}
          style={{ 
            background:'none', border:'none', padding:'0.75rem 1.25rem', cursor:'pointer', 
            fontWeight:600, color: tab==='staff'?'var(--primary-dark)':'var(--text-muted)',
            position:'relative', transition:'all 0.2s'
          }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Users size={17}/> Xodimlar ro'yxati
          </div>
          {tab === 'staff' && <div style={{ position:'absolute', bottom:-9, left:0, right:0, height:3, background:'var(--primary-dark)', borderRadius:'2px 2px 0 0' }} />}
        </button>
        <button 
          onClick={()=>setTab('perms')} 
          className={`tab-btn ${tab==='perms'?'active':''}`}
          style={{ 
            background:'none', border:'none', padding:'0.75rem 1.25rem', cursor:'pointer', 
            fontWeight:600, color: tab==='perms'?'var(--primary-dark)':'var(--text-muted)',
            position:'relative', transition:'all 0.2s'
          }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Shield size={17}/> Vakolatlar matritsasi
          </div>
          {tab === 'perms' && <div style={{ position:'absolute', bottom:-9, left:0, right:0, height:3, background:'var(--primary-dark)', borderRadius:'2px 2px 0 0' }} />}
        </button>
      </div>

      {tab === 'staff' && (
        <div className="card" style={{ padding:0, overflow:'hidden', border:'1px solid var(--border)', borderRadius:'12px', boxShadow:'var(--shadow-sm)' }}>
          <div className="table-wrapper" style={{ border:'none', borderRadius:0 }}>
            <table className="table">
              <thead>
                <tr style={{ background:'var(--surface-2)' }}>
                  <th style={{ padding:'1rem 1.25rem' }}>ID</th>
                  <th>Xodim</th>
                  <th>Lavozim</th>
                  <th>Telefon</th>
                  <th>Ro'yxatdan o'tgan</th>
                  <th>Holat</th>
                  <th style={{ textAlign:'right' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem' }}>
                     <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem' }}>
                       <Loader2 className="animate-spin" size={32} color="var(--primary)"/>
                       <span style={{ color:'var(--text-muted)' }}>Yuklanmoqda...</span>
                     </div>
                   </td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>Xodimlar topilmadi</td></tr>
                ) : staff.map((s: Staff)=>{
                  const role = (ROLES as any)[s.role] || ROLES.CASHIER;
                  return (
                    <tr key={s.id} style={{ transition:'background 0.2s' }}>
                      <td style={{ color:'var(--text-muted)', fontSize:'0.8rem', padding:'1rem 1.25rem' }}>E-{s.id}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                          <div style={{ 
                            width:38, height:38, borderRadius:'10px', 
                            background:`linear-gradient(135deg, ${role.color}15, ${role.color}25)`, 
                            display:'flex', alignItems:'center', justifyContent:'center', 
                            fontWeight:800, color:role.color, fontSize:'0.9rem', flexShrink:0,
                            border:`1px solid ${role.color}40`
                          }}>
                            {s.name.split(' ').map((n: string)=>n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{s.name}</div>
                            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Tizim xodimi</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background:`${role.color}15`, color:role.color, fontWeight:700, padding:'0.25rem 0.75rem', borderRadius:'6px' }}>{role.label}</span>
                      </td>
                      <td style={{ fontSize:'0.875rem', color:'var(--text-secondary)', fontWeight:500 }}>{s.phone}</td>
                      <td style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString('uz-UZ')}</td>
                      <td>
                        <span className={`badge ${s.isActive?'badge-active':'badge-danger'}`} style={{ border: s.isActive ? '1px solid var(--success-border)' : '1px solid var(--danger-border)' }}>
                          {s.isActive?'Faol':'Nofaol'}
                        </span>
                      </td>
                      <td style={{ textAlign:'right' }}>
                        <div style={{ display:'flex', gap:'0.35rem', justifyContent:'flex-end' }}>
                          <button onClick={() => { setEditStaff(s); setShowAddModal(true); }} className="btn btn-ghost btn-icon btn-sm" title="Tahrirlash"><Edit2 size={15}/></button>
                          <button onClick={() => handleDelete(s.id)} className="btn btn-ghost btn-icon btn-sm" style={{ color:'var(--danger)' }} title="O'chirish"><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'perms' && (
        <div className="card" style={{ padding:0, overflow:'hidden', border:'1px solid var(--border)', borderRadius:'12px', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ padding:'1.25rem', borderBottom:'1px solid var(--border)', background:'var(--surface-2)' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:800, marginBottom:'0.25rem' }}>Lavozim vakolatlari</h3>
            <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>Ushbu matritsa orqali har bir lavozimning tizimdagi huquqlarini oniy vaqtda boshqarishingiz mumkin.</p>
          </div>
          <div className="table-wrapper" style={{ border:'none', borderRadius:0 }}>
            <table className="table" style={{ minWidth:'650px' }}>
              <thead>
                <tr>
                  <th style={{ padding:'1rem 1.5rem', width:'200px' }}>🖥️ MODUL NOMİ</th>
                  {Object.keys(ROLES).map((roleKey)=>(
                    <th key={roleKey} style={{ textAlign:'center', padding:'1rem' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem' }}>
                        <span className="badge" style={{ background:`${(ROLES as any)[roleKey].color}15`, color:(ROLES as any)[roleKey].color, fontWeight:800 }}>{(ROLES as any)[roleKey].label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permsLoading ? (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:'3rem' }}><Loader2 className="animate-spin" size={32} color="var(--primary)"/></td></tr>
                ) : MODULES.map((mod, i) => (
                  <tr key={mod} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)05' }}>
                    <td style={{ fontWeight:700, padding:'1.125rem 1.5rem', color:'var(--text-main)', fontSize:'0.9rem' }}>{mod}</td>
                    {Object.keys(ROLES).map(roleKey => {
                      const isActive = rolePermissions[roleKey]?.[mod] || false;
                      const roleColor = (ROLES as any)[roleKey].color;
                      const isReadOnly = roleKey === 'ADMIN';

                      return (
                        <td key={roleKey} style={{ textAlign:'center', padding:'1rem' }}>
                          <div 
                            onClick={() => !isReadOnly && togglePermission(roleKey, mod)}
                            style={{ 
                              width: '42px', height: '22px', borderRadius: '11px',
                              background: isActive ? roleColor : 'var(--border-strong)',
                              position: 'relative', cursor: isReadOnly ? 'not-allowed' : 'pointer', 
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              margin: '0 auto',
                              opacity: isReadOnly ? 0.6 : 1,
                              boxShadow: isActive ? `0 0 10px ${roleColor}30` : 'none'
                            }}
                          >
                            <div style={{
                              position: 'absolute', top: '2px', 
                              left: isActive ? '22px' : '2px',
                              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'1rem 1.5rem', background:'var(--surface-2)', borderTop:'1px solid var(--border)', color:'var(--text-muted)', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Shield size={14}/> Eslatma: <b>Admin</b> lavozimi mutlaq huquqga ega va uning vakolatlarini o'zgartirib bo'lmaydi.
          </div>
        </div>
      )}

      {showAddModal && (
        <AddStaffModal 
          onClose={() => setShowAddModal(false)} 
          onSaved={handleSaved}
          editStaff={editStaff}
        />
      )}
    </div>
  );
}
