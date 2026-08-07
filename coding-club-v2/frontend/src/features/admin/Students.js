import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Students() {
  const { data, loading, refetch } = useFetch('/admin/students?limit=200');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', year: '' });
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEdit(null); setForm({ name: '', email: '', password: '', department: '', year: '' }); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ name: s.name, email: s.email, password: '', department: s.department || '', year: s.year || '' }); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) { await api.put(`/admin/students/${edit.id}`, form); toast.success('Updated'); }
      else { await api.post('/admin/students', form); toast.success('Created'); }
      setOpen(false); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/admin/students/${id}`); toast.success('Deleted'); refetch(); }
    catch { toast.error('Failed'); }
  };

  const list = (data || []).filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.name || '').replace(/\s/g, '').localeCompare((b.name || '').replace(/\s/g, ''), undefined, { sensitivity: 'base' }));

  return (
    <>
      <div className="header">
        <h1>Students</h1>
        <div className="header-actions">
          <div className="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add</button>
        </div>
      </div>
      <div className="body">
        <div className="card">
          {loading ? <div className="loading-page"><div className="spinner" /></div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Name</th><th>Email</th><th>Dept</th><th>Score</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {list.length === 0 ? <tr><td colSpan={6} className="empty">No students</td></tr> :
                  list.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                      <td>{s.department || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{s.total_points}</td>
                      <td><span className={`badge ${s.is_active ? 'badge-active' : 'badge-inactive'}`}>{s.is_active ? 'Active' : 'Off'}</span></td>
                      <td><div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(s)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => del(s.id)}>Del</button>
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit Student' : 'Add Student'}
        footer={<><button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <form>
          {[['name', 'Name'], ['email', 'Email']].map(([k, l]) => (
            <div className="field" key={k}><label>{l}</label><input className="input" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required /></div>
          ))}
          {!edit && <div className="field"><label>Password</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>}
          {[['department', 'Department'], ['year', 'Year']].map(([k, l]) => (
            <div className="field" key={k}><label>{l}</label><input className="input" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
        </form>
      </Modal>
    </>
  );
}
