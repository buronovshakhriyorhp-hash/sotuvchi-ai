import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Database, Settings, Users, Truck,
  BarChart2, ChevronDown, Factory, Hexagon, ShoppingCart, Tags,
  Sliders, RotateCcw, ClipboardList, Layers, FlaskConical,
  ArrowDownToLine, BookText, CreditCard, Phone, ShoppingBag,
  UserCheck, AlertCircle, Zap, LogOut, Shield, Wallet
} from 'lucide-react';
import useAuth from '../store/useAuth';

const MENU = [
  {
    section: 'Asosiy',
    items: [
      { title: 'Bosh sahifa', icon: LayoutDashboard, path: '/' },
      { title: 'Kassir (POS)', icon: Zap, path: '/pos', badge: 'HOT' },
    ]
  },
  {
    section: 'Savdo',
    items: [
      {
        title: 'Mahsulotlar', icon: Package,
        submenus: [
          { title: "Mahsulotlar ro'yxati",     path: '/products/list' },
          { title: "Sotuvlar ro'yxati",         path: '/products/sales' },
          { title: "Buyurtmalar ro'yxati",      path: '/products/orders' },
          { title: "Tushirilganlar ro'yxati",   path: '/products/dropped' },
          { title: "Mijozdan qaytganlar",       path: '/products/returned-customer' },
          { title: "Yetkazuvchiga qaytarilgan", path: '/products/returned-supplier' },
          { title: "Turkumlar ro'yxati",        path: '/products/categories' },
          { title: "Atributlar ro'yxati",       path: '/products/attributes' },
        ]
      },
      { title: 'Ombor', icon: Database, path: '/warehouse' },
      { title: "Qarzlar boshqaruvi", icon: AlertCircle, path: '/debts', badge: 'NEW' },
    ]
  },
  {
    section: "Ishlab chiqarish",
    items: [
      {
        title: 'Ishlab chiqarish', icon: Factory,
        submenus: [
          { title: "Ishlab chiqarilganlar", path: '/production/list' },
          { title: "Xomashyolar",           path: '/production/raw-materials' },
          { title: "Retseptlar",            path: '/production/recipes' },
          { title: "Tushirilganlar",        path: '/production/dropped' },
        ]
      },
    ]
  },
  {
    section: 'CRM',
    items: [
      {
        title: 'Yetkazuvchilar', icon: Truck,
        submenus: [
          { title: "Yetkazuvchilar ro'yxati", path: '/suppliers/list' },
          { title: "Qarzlar ro'yxati",        path: '/suppliers/debts' },
          { title: "Kontaktlar",              path: '/suppliers/contacts' },
        ]
      },
      {
        title: 'Mijozlar', icon: Users,
        submenus: [
          { title: "Mijozlar ro'yxati",  path: '/customers/list' },
          { title: "To'lovlar ro'yxati", path: '/customers/payments' },
          { title: "Kontaktlar",         path: '/customers/contacts' },
        ]
      },
    ]
  },
  {
    section: 'Moliya',
    items: [
      { title: 'Xarajatlar', icon: Wallet, path: '/expenses' },
    ]
  },
  {
    section: 'Tizim',
    items: [
      { title: 'Xodimlar',   icon: UserCheck, path: '/staff' },
      { title: 'Hisobotlar', icon: BarChart2, path: '/reports' },
      { title: 'Audit jurnali', icon: Shield, path: '/audit' },
      {
        title: 'Sozlamalar', icon: Settings,
        submenus: [
          { title: "Umumiy sozlamalar", path: '/settings' },
          { title: "Omborlar boshqaruvi", path: '/settings/warehouses' },
        ]
      },
    ]
  },
];

interface MenuItem {
  title: string;
  icon: any;
  path?: string;
  badge?: string;
  submenus?: { title: string; path: string }[];
}

interface SidebarItemProps {
  item: MenuItem;
  isOpen: boolean;
  toggleOpen: () => void;
  closeSidebar: () => void;
}

function SidebarItem({ item, isOpen, toggleOpen, closeSidebar }: SidebarItemProps) {
  const Icon = item.icon;
  const hasSubmenus = item.submenus && item.submenus.length > 0;

  if (!hasSubmenus) {
    return (
      <div className="sidebar-item">
        <NavLink
          to={item.path || '#'}
          end={item.path === '/'}
          onClick={() => { if (window.innerWidth <= 768) closeSidebar(); }}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <div className="sidebar-link-content">
            <Icon size={18} />
            <span>{item.title}</span>
          </div>
          {item.badge && (
            <span style={{
              fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.02em',
              background: item.badge === 'HOT' ? 'var(--primary)' : 'var(--info)',
              color: item.badge === 'HOT' ? 'var(--primary-deep)' : '#fff',
              padding: '0.125rem 0.4rem', borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>{item.badge}</span>
          )}
        </NavLink>
      </div>
    );
  }

  return (
    <div className="sidebar-item">
      <div className={`sidebar-link${isOpen ? ' active' : ''}`} onClick={toggleOpen}>
        <div className="sidebar-link-content">
          <Icon size={18} />
          <span>{item.title}</span>
        </div>
        <ChevronDown size={14} className={`sidebar-chevron${isOpen ? ' open' : ''}`} style={{ opacity: 0.5 }} />
      </div>
      <div className={`sidebar-submenu${isOpen ? ' open' : ''}`}>
        {item.submenus?.map((sub, i) => (
          <NavLink
            key={i}
            to={sub.path}
            onClick={() => { if (window.innerWidth <= 768) closeSidebar(); }}
            className={({ isActive }) => `submenu-link${isActive ? ' active' : ''}`}
          >
            {sub.title}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, closeSidebar }: { isOpen: boolean; closeSidebar: () => void }) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const toggle = (title: string) => setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  const { logout, user } = useAuth();

  const currentMenu = React.useMemo(() => {
    return [...MENU];
  }, []);

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-header">
        <a href="/" className="logo">
          <Hexagon className="logo-icon" size={26} />
          <span>Nexus</span>
          <span className="logo-badge">ERP</span>
        </a>
      </div>
      <div className="sidebar-content">
        {currentMenu.map((section, si) => (
          <div key={si}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item, ii) => (
              <SidebarItem
                key={ii}
                item={item}
                isOpen={openMenus[item.title]}
                toggleOpen={() => toggle(item.title)}
                closeSidebar={closeSidebar}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <button 
          onClick={logout}
          className="btn btn-outline" 
          style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', color: 'var(--danger)', borderColor: 'transparent' }}
        >
          <LogOut size={18} /> Chiqish
        </button>
      </div>
    </aside>
  );
}
