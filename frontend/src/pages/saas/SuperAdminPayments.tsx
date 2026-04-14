import React from 'react';
import { Wallet, CreditCard, History, TrendingUp, ArrowUpRight, DollarSign, Download, Filter } from 'lucide-react';

export default function SuperAdminPayments() {
  return (
    <div className="fade-in space-y-8">
      <div className="page-title-box">
        <div>
          <h1 className="page-title" style={{ fontSize: '2.2rem', fontWeight: 900 }}>To'lovlar va Tranzaksiyalar</h1>
          <p className="page-subtitle" style={{ fontSize: '1.1rem' }}>Platforma daromadlari va tenantlar hisob-kitoblari monitoringi</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
         <PaymentStat label="Umumiy Daromad" val="$12,450" icon={DollarSign} color="#10b981" />
         <PaymentStat label="Kutilayotgan To'lovlar" val="$860" icon={History} color="#f59e0b" />
         <PaymentStat label="Oxirgi 30 kun" val="+$2,140" icon={TrendingUp} color="#3b82f6" />
      </div>

      <div className="card glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: '32px', border: '1px dashed var(--border)' }}>
         <div style={{ 
           width: 80, 
           height: 80, 
           borderRadius: '24px', 
           background: 'var(--surface-2)', 
           color: 'var(--primary)', 
           display: 'flex', 
           alignItems: 'center', 
           justifyContent: 'center',
           margin: '0 auto 1.5rem'
         }}>
            <CreditCard size={40} />
         </div>
         <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>To'lovlar Moduli Tez Kunda</h2>
         <p style={{ maxWidth: '450px', margin: '0.5rem auto 2rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Biz avtomatlashtirilgan billing tizimi va Click/Payme integratsiyalari ustida ishlayapmiz. 
            Tez orada har bir tenant o'z balansini onlayn to'ldirishi va tariflarni boshqarishi mumkin bo'ladi.
         </p>
         <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '14px', fontWeight: 700 }}>
            Yangilanishlarni kuzatish
         </button>
      </div>
    </div>
  );
}

function PaymentStat({ label, val, icon: Icon, color }: any) {
  return (
    <div className="card glass-card" style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '24px' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{label}</div>
             <div style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--text-main)' }}>{val}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: color + '15', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Icon size={22} />
          </div>
       </div>
    </div>
  );
}
