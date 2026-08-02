import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import api from './lib/api';
import LoginPage from './features/auth/LoginPage';
import StudentLayout from './features/student/StudentLayout';
import AdminLayout from './features/admin/AdminLayout';

function Guard({ children, role }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" />;
  // Admin-role students can access both student and admin routes
  if (role === 'student' && user.role !== 'student' && user.role !== 'admin') return <Navigate to="/login" />;
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/login" />;
  return children;
}

function Public({ children }) {
  const user = useAuthStore(s => s.user);
  if (user) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  const toggle = () => {
    const d = document.documentElement;
    const isDark = d.getAttribute('data-theme') === 'dark';
    d.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  const updateUser = useAuthStore(s => s.updateUser);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    const t = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  // Auto-refresh user role from API on mount (fixes stale localStorage)
  useEffect(() => {
    if (!token) return;
    api.get('/student/profile').then(r => {
      if (r.data?.data) {
        const d = r.data.data;
        updateUser({ role: d.role || 'student', name: d.name });
      }
    }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Public><LoginPage /></Public>} />
        <Route path="/dashboard" element={<Guard role="student"><StudentLayout page="dashboard" /></Guard>} />
        <Route path="/problems" element={<Guard role="student"><StudentLayout page="problems" /></Guard>} />
        <Route path="/problems/:id" element={<Guard role="student"><StudentLayout page="problem" /></Guard>} />
        <Route path="/leaderboard" element={<Guard role="student"><StudentLayout page="leaderboard" /></Guard>} />
        <Route path="/live-points" element={<Guard role="student"><StudentLayout page="live-points" /></Guard>} />
        <Route path="/profile" element={<Guard role="student"><StudentLayout page="profile" /></Guard>} />
        <Route path="/admin" element={<Guard role="admin"><AdminLayout page="dashboard" /></Guard>} />
        <Route path="/admin/students" element={<Guard role="admin"><AdminLayout page="students" /></Guard>} />
        <Route path="/admin/problems" element={<Guard role="admin"><AdminLayout page="problems" /></Guard>} />
        <Route path="/admin/sessions" element={<Guard role="admin"><AdminLayout page="sessions" /></Guard>} />
        <Route path="/admin/reports" element={<Guard role="admin"><AdminLayout page="reports" /></Guard>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
