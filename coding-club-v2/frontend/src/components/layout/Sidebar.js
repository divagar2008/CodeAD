import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function Sidebar({ links, basePath }) {
  const logout = useAuthStore(s => s.logout);
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isAdminRole = user?.role === 'admin';
  const isAdminView = location.pathname.startsWith('/admin');

  // Close sidebar drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleTheme = () => {
    const d = document.documentElement;
    const next = d.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    d.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  return (
    <>
      {/* Fixed Mobile Topbar */}
      <header className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span className="mobile-topbar-title">&lt;/&gt; Coding Club</span>
        <button
          className="mobile-theme-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </header>

      {/* Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-container">
          <div className="sidebar-brand">&lt;/&gt; Coding Club</div>
          <button className="sidebar-close-btn" onClick={() => setIsOpen(false)} aria-label="Close menu">
            &times;
          </button>
        </div>
        <nav className="sidebar-nav">
          {/* Role Switcher for admin students */}
          {isAdminRole && (
            <div className="sidebar-section" style={{ marginBottom: 16 }}>
              <div className="sidebar-label">Switch View</div>
              <div className="role-switcher">
                <button
                  className={`role-switch-btn ${!isAdminView ? 'active' : ''}`}
                  onClick={() => navigate('/dashboard')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Student
                </button>
                <button
                  className={`role-switch-btn ${isAdminView ? 'active' : ''}`}
                  onClick={() => navigate('/admin')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Admin
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-section">
            <div className="sidebar-label">Navigation</div>
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={l.to === basePath}
              >
                {l.icon}
                <span>{l.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <button className="theme-btn" onClick={toggleTheme}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            Toggle Theme
          </button>
          <button
            className="nav-link logout-link"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
