import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { AuthForm } from '../../components/ui/AuthForm';

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const Spinner = () => <div className="auth-spinner" />;

/**
 * Separate sign-in for the single administrator account.
 * Posts to /auth/admin/login (admins table) — student credentials are never
 * accepted here, and this page is not linked from the student login.
 */
export default function AdminLoginPage() {
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill all fields');
    setLoading(true);
    try {
      const user = await login('admin', form.email, form.password);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-image" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/Background.png)` }} />

      <AuthForm
        logo={<LogoIcon />}
        title="Admin Sign In"
        description="CodeAD administration — separate credentials"
        footerContent={
          <p className="auth-footer-text">
            Not an administrator?{' '}
            <button type="button" onClick={() => navigate('/login')} className="auth-footer-link">
              Student Sign In
            </button>
          </p>
        }
      >
        <form onSubmit={handleSubmit} autoComplete="off" className="auth-form">
          <div className="auth-field">
            <label htmlFor="admin-email">Admin Email</label>
            <div className="auth-input-wrap">
              <MailIcon />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@codead.in"
                autoComplete="email"
                name="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="admin-password">Password</label>
            <div className="auth-input-wrap">
              <LockIcon />
              <input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                autoComplete="current-password"
                name="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowIcon />
              </>
            )}
          </button>
        </form>
      </AuthForm>
    </div>
  );
}
