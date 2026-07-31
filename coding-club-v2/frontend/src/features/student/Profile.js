import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', year: user?.year || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.put('/student/profile', form);
      updateUser(r.data.data);
      toast.success('Updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords mismatch');
    setLoading(true);
    try {
      await api.put('/student/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="header"><h1>Profile</h1></div>
      <div className="body">
        <div className="profile-header">
          <div className="profile-avatar">{user?.name?.[0]}</div>
          <div>
            <h2 style={{ fontWeight: 600 }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email}</p>
            <div className="profile-stats">
              <span><strong>{user?.problems_solved || 0}</strong> solved</span>
              <span><strong>{user?.total_points || 0}</strong> points</span>
            </div>
          </div>
        </div>
        <div className="tabs" style={{ maxWidth: 300 }}>
          <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Edit Profile</button>
          <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>Password</button>
        </div>
        {tab === 'profile' ? (
          <div className="card" style={{ maxWidth: 480 }}>
            <form onSubmit={saveProfile}>
              {['name', 'department', 'year'].map(f => (
                <div className="field" key={f}><label>{f[0].toUpperCase() + f.slice(1)}</label>
                <input className="input" value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} /></div>
              ))}
              <button className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Saving...' : 'Save'}</button>
            </form>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 480 }}>
            <form onSubmit={changePw}>
              {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirm', 'Confirm Password']].map(([k, l]) => (
                <div className="field" key={k}><label>{l}</label>
                <input className="input" type="password" value={pwForm[k]} onChange={e => setPwForm({ ...pwForm, [k]: e.target.value })} /></div>
              ))}
              <button className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Changing...' : 'Change Password'}</button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
