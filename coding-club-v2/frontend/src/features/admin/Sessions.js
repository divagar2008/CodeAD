import React, { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Sessions() {
  const { data: sessions, loading, refetch } = useFetch('/admin/sessions');
  const { data: students } = useFetch('/admin/students?limit=100');
  const [open, setOpen] = useState(false);
  const [ptsOpen, setPtsOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', description: '' });
  const [ptsForm, setPtsForm] = useState({ session_id: '', student_id: '', points: '' });
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEdit(null); setForm({ name: '', date: '', description: '' }); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ name: s.name, date: new Date(s.date).toISOString().slice(0, 16), description: s.description || '' }); setOpen(true); };
  const openPts = (sid) => { setPtsForm({ session_id: sid, student_id: '', points: '' }); setPtsOpen(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (edit) { await api.put(`/admin/sessions/${edit.id}`, form); toast.success('Updated'); }
      else { await api.post('/admin/sessions', form); toast.success('Created'); }
      setOpen(false); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const savePts = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/admin/sessions/points', ptsForm); toast.success('Points awarded'); setPtsOpen(false); refetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/admin/sessions/${id}`); toast.success('Deleted'); refetch(); } catch { toast.error('Failed'); } };

  return (
    <>
      <div className="header"><h1>Live Sessions</h1><button className="btn btn-primary" onClick={openCreate}>+ Create</button></div>
      <div className="body">
        {loading ? <div className="loading-page"><div className="spinner" /></div> :
          (!sessions || sessions.length === 0) ? <div className="empty">No sessions</div> : (
            <div className="grid g2">
              {sessions.map(s => (
                <div className="card" key={s.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontWeight: 600 }}>{s.name}</h3>
                    <span className={`badge ${s.is_published ? 'badge-active' : 'badge-inactive'}`}>{s.is_published ? 'Published' : 'Draft'}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{s.description || 'No description'}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    {new Date(s.date).toLocaleDateString()} &middot; {s._count?.live_points || 0} participants
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => openPts(s.id)}>Award</button>
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(s)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => del(s.id)}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit Session' : 'Create Session'}
        footer={<><button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <form>
          <div className="field"><label>Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="field"><label>Date</label><input className="input" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
          <div className="field"><label>Description</label><textarea className="textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
        </form>
      </Modal>
      <Modal open={ptsOpen} onClose={() => setPtsOpen(false)} title="Award Points"
        footer={<><button className="btn btn-outline" onClick={() => setPtsOpen(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={savePts} disabled={saving}>{saving ? 'Awarding...' : 'Award'}</button></>}>
        <form>
          <div className="field"><label>Student</label><select className="select" value={ptsForm.student_id} onChange={e => setPtsForm({ ...ptsForm, student_id: e.target.value })} required>
            <option value="">Select...</option>{(students || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="field"><label>Points</label><input className="input" type="number" min="0" max="100" value={ptsForm.points} onChange={e => setPtsForm({ ...ptsForm, points: e.target.value })} required /></div>
        </form>
      </Modal>
    </>
  );
}
