import React from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Dashboard from './Dashboard';
import Problems from './Problems';
import ProblemPage from './ProblemPage';
import Leaderboard from './Leaderboard';
import LivePoints from './LivePoints';
import Profile from './Profile';

const I = (d, s) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d.split('.').map((p, i) => React.createElement(p.split(',')[0], { key: i, ...Object.fromEntries((p.split(',').slice(1).map(x => x.split('='))) )}))}</svg>;

const links = [
  { to: '/dashboard', label: 'Home', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { to: '/problems', label: 'Solve Problems', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg> },
  { to: '/live-points', label: 'Live Points', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { to: '/profile', label: 'Profile', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

const pages = { dashboard: Dashboard, problems: Problems, problem: ProblemPage, leaderboard: Leaderboard, 'live-points': LivePoints, profile: Profile };

export default function StudentLayout({ page }) {
  const Page = pages[page] || Dashboard;
  return (
    <div className="app">
      <Sidebar links={links} basePath="/dashboard" />
      <main className="main"><Page /></main>
    </div>
  );
}
