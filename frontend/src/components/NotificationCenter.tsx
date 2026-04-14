import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertCircle, ShoppingCart, Package, DollarSign, Trash2 } from 'lucide-react';

const INITIAL = [
  { id:1, type:'danger',  icon:'alert',  title:"Muddati o'tgan qarz!",              msg:'Qurilish MChJ — 450,000 so\'m, 3 kun kechikdi',       time:'2 daqiqa oldin', read:false, path: '/debts' },
  { id:2, type:'warning', icon:'stock',  title:'Mahsulot tugayapti',                msg:'Running Sneakers Pro — atigi 12 ta qoldi',             time:'15 daqiqa oldin', read:false, path: '/products/list' },
  { id:3, type:'success', icon:'sale',   title:'Yangi sotuv!',                      msg:'S-7042 — Zarina R. — 450,000 so\'m (Plastik)',         time:'32 daqiqa oldin', read:false, path: '/products/sales' },
  { id:4, type:'info',    icon:'order',  title:'Yangi buyurtma keldi',              msg:'ORD-006 — Mega Store LLC — 9,495,000 so\'m',           time:'1 soat oldin',    read:true,  path: '/products/orders' },
  { id:5, type:'warning', icon:'stock',  title:'Mahsulot tugayapti',                msg:'Classic Sunglasses — atigi 15 ta qoldi',               time:'2 soat oldin',    read:true,  path: '/products/list' },
  { id:6, type:'success', icon:'sale',   title:'Katta sotuv amalga oshirildi!',     msg:'S-7041 — Qurilish MChJ — 1,200,000 so\'m (Bank)',      time:'3 soat oldin',    read:true,  path: '/products/sales' },
];

const ICON_MAP: Record<string, { icon: any; bg: string; color: string }> = {
  alert: { icon: AlertCircle,   bg:'#fee2e2', color:'#dc2626' },
  stock: { icon: Package,       bg:'#fef3c7', color:'#d97706' },
  sale:  { icon: DollarSign,    bg:'#dcfce7', color:'#16a34a' },
  order: { icon: ShoppingCart,  bg:'#e0f2fe', color:'#0284c7' },
};

interface NotificationCenterProps {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<any[]>(INITIAL);

  const markAll = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const remove  = (id: number | string) => setNotifs(p => p.filter(n => n.id !== id));
  const markAndNavigate = (n: any) => {
    setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (n.path) {
      navigate(n.path);
      onClose();
    }
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={{ width:'380px', maxHeight:'80vh', display:'flex', flexDirection:'column', background:'var(--surface)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-xl)', border:'1px solid var(--border)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Bell size={18}/>
          <span style={{ fontWeight:700, fontSize:'0.9375rem' }}>Bildirishnomalar</span>
          {unread > 0 && <span style={{ background:'var(--danger)', color:'#fff', borderRadius:'999px', padding:'0.1rem 0.45rem', fontSize:'0.7rem', fontWeight:700 }}>{unread}</span>}
        </div>
        <button onClick={markAll} className="btn btn-ghost btn-sm" style={{ fontSize:'0.75rem', gap:'0.25rem' }}>
          <CheckCheck size={13}/> Barchasini o'qi
        </button>
      </div>

      {/* List */}
      <div style={{ overflowY:'auto', flex:1 }}>
        {notifs.length === 0 ? (
          <div className="empty-state" style={{ padding:'3rem' }}>
            <div className="empty-state-icon"><Bell size={24}/></div>
            <span className="empty-state-title">Bildirishnomalar yo'q</span>
          </div>
        ) : notifs.map(n => {
          const { icon: Icon, bg, color } = ICON_MAP[n.icon];
          return (
            <div
              key={n.id}
              onClick={() => markAndNavigate(n)}
              style={{ display:'flex', gap:'0.875rem', padding:'0.875rem 1.25rem', borderBottom:'1px solid var(--border)', background: n.read ? 'transparent' : 'var(--primary-light)', cursor:'pointer', transition:'background 0.15s', position:'relative' }}
              onMouseEnter={e => e.currentTarget.style.background = n.read ? 'var(--surface-2)' : '#fef08a'}
              onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--primary-light)'}
            >
              <div style={{ width:38, height:38, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={18} color={color}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight: n.read ? 500 : 700, fontSize:'0.875rem', marginBottom:'0.2rem' }}>{n.title}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.4 }}>{n.msg}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.375rem' }}>{n.time}</div>
              </div>
              {!n.read && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--primary-dark)', position:'absolute', top:'1rem', right:'1rem', flexShrink:0 }}/>}
              <button
                onClick={e => { e.stopPropagation(); remove(n.id); }}
                className="btn btn-ghost btn-icon btn-sm"
                style={{ flexShrink:0, opacity:0.5, width:28, height:28 }}
              ><Trash2 size={13}/></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
