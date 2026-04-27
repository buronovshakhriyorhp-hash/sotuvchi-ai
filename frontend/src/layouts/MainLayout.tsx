import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebar-collapsed') === 'true');

  const toggleSidebar = () => {
    if (window.innerWidth > 768) {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem('sidebar-collapsed', String(newState));
    } else {
      setIsSidebarOpen(prev => !prev);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Auto-inject data-label to all table cells for perfect mobile card layouts
  React.useEffect(() => {
    const attachLabels = () => {
      document.querySelectorAll('table.table').forEach(table => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent || '');
        if (headers.length) {
          table.querySelectorAll('tbody tr').forEach(tr => {
            Array.from(tr.querySelectorAll('td')).forEach((td, i) => {
               if (headers[i]) td.setAttribute('data-label', headers[i]);
            });
          });
        }
      });
    };
    attachLabels();
    const observer = new MutationObserver(attachLabels);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`app-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        isCollapsed={isCollapsed} 
        toggleCollapse={toggleSidebar}
        closeSidebar={closeSidebar} 
      />
      
      <div className="main-content">
        <Navbar toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
        <main className="page-container fade-in">
          <Outlet />
        </main>
      </div>

      {/* Ultra Native Premium Mobile Bottom Nav */}
      <div className="mobile-app-bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `app-tab ${isActive ? 'active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" rx="2" ry="2" width="7" height="7"/><rect x="14" y="3" rx="2" ry="2" width="7" height="7"/><rect x="14" y="14" rx="2" ry="2" width="7" height="7"/><rect x="3" y="14" rx="2" ry="2" width="7" height="7"/></svg>
          <span>Asosiy</span>
        </NavLink>
        <NavLink to="/pos" className={({ isActive }) => `app-tab ${isActive ? 'active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          <span>Sotuv</span>
        </NavLink>
        <button onClick={toggleSidebar} className="app-tab central-tab">
          <div className="central-tab-inner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
        </button>
        <NavLink to="/warehouse" className={({ isActive }) => `app-tab ${isActive ? 'active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <span>Ombor</span>
        </NavLink>
        <NavLink to="/debts" className={({ isActive }) => `app-tab ${isActive ? 'active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Qarzlar</span>
        </NavLink>
      </div>
    </div>
  );
}
