import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { AuthForm } from '../../components/ui/AuthForm';

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const Spinner = () => (
  <div className="auth-spinner" />
);

export default function LoginPage() {
  const login = useAuthStore(s => s.login);
  const register = useAuthStore(s => s.register);
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', year: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegister) {
      if (!form.name || !form.email || !form.password) {
        return toast.error('Name, email, and password are required');
      }
      if (form.password.length < 6) {
        return toast.error('Password must be at least 6 characters');
      }
      setLoading(true);
      try {
        const user = await register(form.name, form.email, form.password, form.department, form.year);
        toast.success(`Welcome to CodeAD, ${user.name}!`);
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
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
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setForm({ name: '', email: '', password: '', department: '', year: '' });
  };

  return (
    <div className="login-page">
      {/* Background image */}
      <div className="login-bg-image" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/Background.png)` }} />

      {/* Auth card */}
      <AuthForm
        logo={<LogoIcon />}
        title={isRegister ? 'Create Account' : 'Welcome Back'}
        description={isRegister ? 'Join the CodeAD community' : 'Sign in to your CodeAD account'}
        footerContent={
          <p className="auth-footer-text">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={toggleMode} className="auth-footer-link">
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        }
      >
        <form onSubmit={handleSubmit} autoComplete="off" className="auth-form">
          {isRegister && (
            <div className="auth-field">
              <label htmlFor="auth-name">Name</label>
              <div className="auth-input-wrap">
                <UserIcon />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                  name="register_name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <div className="auth-input-wrap">
              <MailIcon />
              <input
                id="auth-email"
                type="email"
                placeholder="you@college.edu"
                autoComplete="email"
                name="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-wrap">
              <LockIcon />
              <input
                id="auth-password"
                type="password"
                placeholder={isRegister ? 'Min 6 characters' : 'Enter your password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                name="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div className="auth-field">
                <label htmlFor="auth-department">Department (optional)</label>
                <div className="auth-input-wrap">
                  <BuildingIcon />
                  <input
                    id="auth-department"
                    type="text"
                    placeholder="e.g. Computer Science"
                    autoComplete="organization-title"
                    name="register_department"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="auth-year">Year (optional)</label>
                <div className="auth-input-wrap">
                  <CalendarIcon />
                  <input
                    id="auth-year"
                    type="text"
                    placeholder="e.g. 2nd"
                    autoComplete="off"
                    name="register_year"
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                {isRegister ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'}
                <ArrowIcon />
              </>
            )}
          </button>
        </form>
      </AuthForm>
    </div>
  );
}
