import React from 'react';
import { Globe, Shield, Terminal, Database, Bell, Save, RefreshCw, Lock, Zap } from 'lucide-react';

export default function SuperAdminSettings() {
  return (
    <div className="fade-in space-y-8">
      <div className="page-title-box">
        <div>
          <h1 className="page-title" style={{ fontSize: '2.2rem', fontWeight: 900 }}>Global Sozlamalar</h1>
          <p className="page-subtitle" style={{ fontSize: '1.1rem' }}>Platforma parametrlari va SaaS konfiguratsiyasi</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
           <Save size={18} /> O'zgarishlarni saqlash
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
         <div className="space-y-4">
            <SettingsNav icon={Globe} label="Umumiy Sozlamalar" active />
            <SettingsNav icon={Shield} label="Xavfsizlik va Kirish" />
            <SettingsNav icon={Bell} label="Bildirishnomalar (Telegram)" />
            <SettingsNav icon={Terminal} label="Tizim Loglari" />
            <SettingsNav icon={Database} label="Ma'lumotlar Bazasi" />
         </div>

         <div className="card glass-card" style={{ padding: '2.5rem', borderRadius: '28px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 850, marginBottom: '2rem' }}>Platforma Konfiguratsiyasi</h3>
            
            <div className="space-y-6">
               <div className="form-group">
                  <label style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Platforma Nomi</label>
                  <input type="text" className="form-control" defaultValue="Nexus ERP SaaS" style={{ borderRadius: '12px', height: '48px' }} />
               </div>

               <div className="form-group">
                  <label style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Sinov Muddati (Kunlar)</label>
                  <input type="number" className="form-control" defaultValue="30" style={{ borderRadius: '12px', height: '48px' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Yangi ro'yxatdan o'tgan bizneslarga avtomatik beriladigan trial muddati.</p>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                     <label style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Yangi Ro'yxatdan O'tish</label>
                     <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                           <input type="radio" name="reg" defaultChecked /> Ochiq
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                           <input type="radio" name="reg" /> Tasdiq bilan
                        </label>
                     </div>
                  </div>
                  <div className="form-group">
                     <label style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Texnik Ishlar Rejimi</label>
                     <div style={{ 
                       width: 48, 
                       height: 24, 
                       background: 'var(--surface-2)', 
                       borderRadius: '50px', 
                       position: 'relative',
                       cursor: 'pointer',
                       border: '1px solid var(--border)'
                     }}>
                        <div style={{ width: 18, height: 18, background: 'var(--text-muted)', borderRadius: '50%', position: 'absolute', top: 2, left: 2 }} />
                     </div>
                  </div>
               </div>

               <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1rem 0' }} />

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div>
                     <div style={{ fontWeight: 800, fontSize: '1rem' }}>SaaS API Klyuchi</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tashqi integratsiyalar uchun maxfiy klyuch</div>
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ borderRadius: '8px' }}>
                     <RefreshCw size={14} /> Yangilash
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function SettingsNav({ icon: Icon, label, active }: any) {
  return (
    <div style={{ 
      padding: '1rem 1.5rem', 
      borderRadius: '16px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem',
      background: active ? 'var(--primary-light)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--text-main)',
      fontWeight: active ? 800 : 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: active ? '1px solid var(--primary-light)' : '1px solid transparent'
    }}>
       <Icon size={20} />
       <span>{label}</span>
       {active && <Zap size={14} style={{ marginLeft: 'auto', fill: 'currentColor' }} />}
    </div>
  );
}
