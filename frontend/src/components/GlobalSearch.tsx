import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Users, ShoppingCart, BarChart2, Zap, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const SEARCH_DATA = [
  { type:'Sahifa',    icon: Zap,         label:'Kassir paneli (POS)',           path:'/pos' },
  { type:'Sahifa',    icon: BarChart2,   label:'Hisobotlar',                    path:'/reports' },
  { type:'Sahifa',    icon: Database,    label:'Ombor',                         path:'/warehouse' },
  { type:'Mahsulot',  icon: Package,     label:'T-Shirt Cotton Basic',          path:'/products/list' },
  { type:'Mahsulot',  icon: Package,     label:'Denim Jeans Blue',              path:'/products/list' },
  { type:'Mahsulot',  icon: Package,     label:'Leather Wallet Slim',           path:'/products/list' },
  { type:'Mijoz',     icon: Users,       label:'Aliyev Vali',                   path:'/customers/list' },
  { type:'Mijoz',     icon: Users,       label:'Mega Store LLC',                path:'/customers/list' },
  { type:'Mijoz',     icon: Users,       label:'Qurilish MChJ',                 path:'/customers/list' },
  { type:'Buyurtma',  icon: ShoppingCart,label:'ORD-001 — Aliyev Vali',        path:'/products/orders' },
  { type:'Buyurtma',  icon: ShoppingCart,label:'ORD-002 — Zarina R.',          path:'/products/orders' },
];

const TYPE_COLORS = {
  'Sahifa':   { bg:'#e0f2fe', color:'#0284c7' },
  'Mahsulot': { bg:'#fef3c7', color:'#d97706' },
  'Mijoz':    { bg:'#dcfce7', color:'#16a34a' },
  'Buyurtma': { bg:'#f3e8ff', color:'#9333ea' },
};

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (query.length < 2) {
      setTimeout(() => setResults(SEARCH_DATA.slice(0, 6)), 0);
      return;
    }
    const delay = setTimeout(async () => {
      
      try {
        const res = await api.get('/search', { params: { q: query } });
        setResults([...SEARCH_DATA.filter(d => d.type === 'Sahifa' && d.label.toLowerCase().includes(query.toLowerCase())), ...res]);
      } catch (e) { console.error(e); }
      
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const go = (path) => { navigate(path); onClose(); };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s+1, results.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === 'Enter' && results[selected]) go(results[selected].path);
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay" style={{ alignItems:'flex-start', paddingTop:'10vh' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:'560px', background:'var(--surface)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-xl)', border:'1px solid var(--border)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        {/* Input */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0 1.25rem', borderBottom:'1px solid var(--border)', height:'56px' }}>
          <Search size={20} color="var(--text-muted)"/>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            placeholder="Mahsulot, mijoz, buyurtma, sahifa qidirish..."
            style={{ flex:1, border:'none', outline:'none', fontSize:'1rem', background:'transparent', color:'var(--text)', fontFamily:'inherit' }}
          />
          <div style={{ display:'flex', gap:'0.375rem', alignItems:'center' }}>
            <kbd style={{ fontSize:'0.7rem', padding:'0.2rem 0.4rem', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'4px', color:'var(--text-muted)' }}>ESC</kbd>
            <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16}/></button>
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight:'400px', overflowY:'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:'0.875rem' }}>
              "{query}" bo'yicha hech narsa topilmadi
            </div>
          ) : (
            <>
              {!query && <div style={{ padding:'0.75rem 1.25rem 0.375rem', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.06em', color:'var(--text-muted)', textTransform:'uppercase' }}>Tez kirish</div>}
              {results.map((r, i) => {
                const Icon = r.icon;
                const tc = TYPE_COLORS[r.type] || {};
                return (
                  <div
                    key={i}
                    onClick={() => go(r.path)}
                    style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.75rem 1.25rem', cursor:'pointer', background: selected===i ? 'var(--primary-light)' : 'transparent', transition:'background 0.1s', borderRadius:0 }}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <div style={{ width:36, height:36, borderRadius:'var(--radius)', background:tc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={17} color={tc.color}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{r.label}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{r.type}</div>
                    </div>
                    {selected === i && (
                      <kbd style={{ fontSize:'0.7rem', padding:'0.2rem 0.4rem', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'4px', color:'var(--text-muted)' }}>Enter</kbd>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'0.625rem 1.25rem', borderTop:'1px solid var(--border)', display:'flex', gap:'1rem', fontSize:'0.75rem', color:'var(--text-muted)' }}>
          <span>↑↓ navigatsiya</span>
          <span>↵ ochish</span>
          <span>ESC yopish</span>
        </div>
      </div>
    </div>
  );
}
