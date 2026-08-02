import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import ShaderAnimation from '../../components/ui/ShaderAnimation';

export default function LoginPage() {
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill all fields');
    setLoading(true);
    try {
      const user = await login('student', form.email, form.password);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Shader background — fills entire viewport */}
      <div className="login-shader-bg">
        <ShaderAnimation />
        {/* Soft gradient overlay for readability */}
        <div className="login-shader-overlay" />
      </div>

      {/* Floating brand text — visible on larger screens */}
      <div className="login-brand">
        <h1>&lt;/&gt; Coding Club</h1>
        <p>Practice coding, get AI-powered reviews, and track your progress. Built for students who want to get better.</p>
      </div>

      {/* Login card — glassmorphism style */}
      <div className="login-card-container">
        <div className="login-glass-card">
          {/* Logo mark */}
          <div className="login-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>

          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your coding club account</p>

          {/* Login form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="login-field">
              <label>Email</label>
              <div className="login-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.4 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  placeholder="you@college.edu"
                  autoComplete="off"
                  name="login_email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="login-field">
              <label>Password</label>
              <div className="login-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.4 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  name="login_password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
