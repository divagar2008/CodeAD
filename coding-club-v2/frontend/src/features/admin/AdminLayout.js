import React from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Dashboard from './Dashboard';
import Students from './Students';
import Problems from './Problems';
import Sessions from './Sessions';
import Reports from './Reports';

const links = [
  { to: '/admin', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { to: '/admin/students', label: 'Students', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
  { to: '/admin/problems', label: 'Problems', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
  { to: '/admin/sessions', label: 'Sessions', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { to: '/admin/reports', label: 'Reports', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
];

const pages = { dashboard: Dashboard, students: Students, problems: Problems, sessions: Sessions, reports: Reports };

export default function AdminLayout({ page }) {
  const Page = pages[page] || Dashboard;
  return (
    <div className="app">
      <Sidebar links={links} basePath="/admin" />
      <main className="main"><Page /></main>
    </div>
  );
}
