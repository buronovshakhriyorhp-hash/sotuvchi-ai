import React, { useState } from 'react';
import { Building2, Palette, Bell, Shield, Save, Moon, Sun, Globe, Printer, MessageSquare, ExternalLink, Download, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

const TABS = [
  { id:'company',  label:'Kompaniya',     icon: Building2 },
  { id:'notify',   label:'Bildirishnoma', icon: Bell      },
  { id:'telegram', label:'Telegram Bot',  icon: MessageSquare },
  { id:'security', label:'Xavfsizlik',    icon: Shield    },
  { id:'print',    label:'Chop etish',    icon: Printer   },
];

const Toggle = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)} style={{ width:44, height:24, borderRadius:999, background: value ? 'var(--primary)' : 'var(--border-strong)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: value ? 22 : 2, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
  </div>
);
export default function Settings() {
  const [tab, setTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: 'Nexus Savdo LLC',
    phone: '+998 94 100 91 22',
    address: 'Toshkent sh., Yunusobod tumani',
    currency: 'uzs',
    language: 'uz',
    lowStockAlert: true,
    overdueAlert: true,
    newOrderAlert: true,
    bigSaleAlert: true,
    twoFA: false,
    sessionTimeout: '30',
    receiptFooter: 'Xaridingiz uchun rahmat! Qayta ko\'ring!',
    printCopies: '1',
    telegramNotifications: true,
  });

  const [botData, setBotData] = useState({ loading: false, data: null });

  const fetchBotInfo = async () => {
    setBotData(prev => ({ ...prev, loading: true }));
    try {
      const data = await api.get('/telegram/info');
      if (data) {
        setBotData({ loading: false, data });
      }
    } catch (err) {
      console.error(err);
      setBotData(prev => ({ ...prev, loading: false }));
    }
  };

  React.useEffect(() => {
    if (tab === 'telegram' && !botData.data) {
      fetchBotInfo();
    }
  }, [tab]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <div>
          <h1 className="page-title">Sozlamalar</h1>
          <p className="page-subtitle">Tizim va kompaniya sozlamalari</p>
        </div>
        <button onClick={handleSave} className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}>
          <Save size={16}/> {saved ? '✓ Saqlandi!' : 'Saqlash'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:'1.25rem', alignItems:'start' }}>
        {/* Sidebar tabs */}
        <div className="card" style={{ padding:'0.625rem' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:'flex', alignItems:'center', gap:'0.75rem', width:'100%', padding:'0.75rem 0.875rem', borderRadius:'var(--radius)', border:'none', fontFamily:'inherit', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', background: tab===t.id ? 'var(--primary-light)' : 'transparent', color: tab===t.id ? 'var(--primary-dark)' : 'var(--text-secondary)', marginBottom:'2px', transition:'all 0.15s' }}>
                <Icon size={16}/> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="card">
          {tab === 'company' && (
            <div>
              <div className="card-title" style={{ marginBottom:'1.5rem' }}>Kompaniya ma'lumotlari</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                {[
                  ['Kompaniya nomi', 'companyName', 'text', 'Nexus Savdo LLC'],
                  ['Telefon raqam',  'phone',       'text', '+998 94 100 91 22'],
                  ['Manzil',         'address',     'text', 'Toshkent sh.'],
                ].map(([label, key, type, ph]) => (
                  <div key={key} className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">{label}</label>
                    <input className="input-field" type={type} value={form[key]} placeholder={ph} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Valyuta</label>
                    <select className="input-field" value={form.currency} onChange={e=>set('currency',e.target.value)}>
                      <option value="uzs">UZS — So'm</option>
                      <option value="usd">USD — Dollar</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Til</label>
                    <select className="input-field" value={form.language} onChange={e=>set('language',e.target.value)}>
                      <option value="uz">O'zbekcha</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'notify' && (
            <div>
              <div className="card-title" style={{ marginBottom:'1.5rem' }}>Bildirishnoma sozlamalari</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                {[
                  ['lowStockAlert',  'Mahsulot kam qolganda ogohlantirish',    'Minimal qoldiq ostiga tushganda bildirishnoma yuborish'],
                  ['overdueAlert',   "Muddati o'tgan qarz ogohlantirishlari",  "Qarz muddati o'tganda avtomatik eslatma"],
                  ['newOrderAlert',  'Yangi buyurtma bildirishnomalari',        'Har bir yangi buyurtmada xabar yuborish'],
                  ['bigSaleAlert',   'Katta sotuv bildirishnomalari',           '1,000,000 so\'mdan yuqori sotuvda ogohlantirish'],
                ].map(([key, title, desc]) => (
                  <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{title}</div>
                      <div style={{ fontSize:'0.8125rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{desc}</div>
                    </div>
                    <Toggle value={form[key]} onChange={v=>set(key,v)}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'telegram' && (
            <div>
              <div className="card-title" style={{ marginBottom:'1.5rem' }}>Telegram Bot Sozlamalari</div>
              
              <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'2rem', alignItems:'center' }}>
                <div style={{ textAlign:'center', background:'var(--surface-2)', padding:'1.5rem', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)' }}>
                  {botData.loading ? (
                    <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <RefreshCw size={32} className="spin" style={{ color:'var(--primary)' }}/>
                    </div>
                  ) : botData.data ? (
                    <>
                      <img src={botData.data.qrCode} alt="Bot QR" style={{ width:'100%', borderRadius:'var(--radius)', marginBottom:'1rem' }} />
                      <div style={{ fontSize:'0.8125rem', color:'var(--text-muted)', marginBottom:'1rem' }}>Skanerlang va botga obuna bo'ling</div>
                      <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center' }}>
                        <a href={botData.data.link} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" style={{ textDecoration:'none' }}>
                          <ExternalLink size={14}/> Botga o'tish
                        </a>
                        <button className="btn btn-sm btn-secondary" onClick={() => {
                          const link = document.createElement('a');
                          link.href = botData.data.qrCode;
                          link.download = 'bot_qr.png';
                          link.click();
                        }}>
                          <Download size={14}/> Yuklash
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding:'2rem', color:'var(--text-muted)' }}>Bot ma'lumotlarini yuklab bo'lmadi</div>
                  )}
                </div>

                <div>
                  <div style={{ marginBottom:'1.5rem' }}>
                    <div style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'0.5rem' }}>Bot orqali mijozlarni ro'yxatdan o'tkazish</div>
                    <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem', lineHeight:1.5 }}>
                      Mijozlaringiz ushbu QR-kodni skanerlash orqali botga obuna bo'lishlari mumkin. 
                      Bot orqali ular:
                    </p>
                    <ul style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:'0.75rem', paddingLeft:'1.25rem' }}>
                      <li style={{ marginBottom:'0.4rem' }}>Xaridlari haqida PDF cheklarni olishadi</li>
                      <li style={{ marginBottom:'0.4rem' }}>Qarz va nasiyalar haqida ma'lumot olishadi</li>
                      <li>Yangi chegirmalar va yangiliklardan habardor bo'lishadi</li>
                    </ul>
                  </div>

                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1.5rem' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                      <div>
                        <div style={{ fontWeight:600 }}>Telegram bildirishnomalari</div>
                        <div style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>Sotuvdan so'ng mijozga avtomatik chek yuborish</div>
                      </div>
                      <Toggle value={form.telegramNotifications} onChange={v=>set('telegramNotifications',v)}/>
                    </div>
                    
                    {botData.data && (
                      <div style={{ background:'var(--surface-3)', padding:'0.75rem', borderRadius:'var(--radius)', fontSize:'0.875rem', color:'var(--primary-dark)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--success)' }}></div>
                        Bot faol: <b>@{botData.data.username}</b>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div>
              <div className="card-title" style={{ marginBottom:'1.5rem' }}>Xavfsizlik</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontWeight:600 }}>Ikki bosqichli tasdiqlash (2FA)</div>
                    <div style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>Hisobga kirish uchun SMS kodi talab qilinadi</div>
                  </div>
                  <Toggle value={form.twoFA} onChange={v=>set('twoFA',v)}/>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Sessiya muddati (daqiqa)</label>
                  <select className="input-field" value={form.sessionTimeout} onChange={e=>set('sessionTimeout',e.target.value)}>
                    <option value="15">15 daqiqa</option>
                    <option value="30">30 daqiqa</option>
                    <option value="60">1 soat</option>
                    <option value="0">Cheksiz</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Parolni o'zgartirish</label>
                  <input className="input-field" type="password" placeholder="Yangi parol..." />
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <input className="input-field" type="password" placeholder="Yangi parolni tasdiqlang..." />
                </div>
              </div>
            </div>
          )}

          {tab === 'print' && (
            <div>
              <div className="card-title" style={{ marginBottom:'1.5rem' }}>Chop etish sozlamalari</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Chek pastki qismi (footer)</label>
                  <textarea className="input-field textarea-field" rows={3} value={form.receiptFooter} onChange={e=>set('receiptFooter',e.target.value)} style={{ resize:'vertical' }}/>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Nusxa soni</label>
                  <select className="input-field" value={form.printCopies} onChange={e=>set('printCopies',e.target.value)}>
                    <option value="1">1 nusxa</option>
                    <option value="2">2 nusxa</option>
                    <option value="3">3 nusxa</option>
                  </select>
                </div>
                <div style={{ background:'var(--surface-2)', borderRadius:'var(--radius)', padding:'1.25rem', border:'1px dashed var(--border)' }}>
                  <div style={{ fontSize:'0.8125rem', color:'var(--text-muted)', marginBottom:'0.5rem', fontWeight:600 }}>Chek namunasi:</div>
                  <div style={{ fontFamily:'monospace', fontSize:'0.8rem', lineHeight:1.8, color:'var(--text-secondary)' }}>
                    <div style={{ textAlign:'center', fontWeight:'bold' }}>{form.companyName || 'Nexus Savdo'}</div>
                    <div style={{ textAlign:'center', color:'var(--text-muted)' }}>{new Date().toLocaleString('uz-UZ')}</div>
                    <div>-------------------------------</div>
                    <div>Mahsulot × 1............159,900</div>
                    <div>-------------------------------</div>
                    <div style={{ fontWeight:'bold' }}>JAMI: 159,900 so'm</div>
                    <div>-------------------------------</div>
                    <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.75rem' }}>{form.receiptFooter}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
