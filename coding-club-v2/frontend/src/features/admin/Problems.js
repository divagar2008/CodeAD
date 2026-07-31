import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Problems() {
  const { data, loading, refetch } = useFetch('/admin/problems');
  const [search, setSearch] = useState('');
  const [diff, setDiff] = useState('');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', difficulty: 'easy', input_description: '', output_description: '', constraints: '', examples: { input: '', output: '' } });
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEdit(null); setForm({ title: '', description: '', difficulty: 'easy', input_description: '', output_description: '', constraints: '', examples: { input: '', output: '' } }); setOpen(true); };
  const openEdit = (p) => {
    setEdit(p);
    let ex = {};
    if (p.examples) {
      if (typeof p.examples === 'object') ex = p.examples;
      else if (typeof p.examples === 'string') {
        try { ex = JSON.parse(p.examples); if (typeof ex === 'string') ex = JSON.parse(ex); } catch (e) { ex = { input: p.examples, output: '' }; }
      }
    }
    setForm({
      title: p.title, description: p.description, difficulty: p.difficulty,
      input_description: p.input_description || '', output_description: p.output_description || '',
      constraints: p.constraints || '', examples: { input: ex?.input || '', output: ex?.output || '' }
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const d = { ...form, examples: form.examples };
      if (edit) { await api.put(`/admin/problems/${edit.id}`, d); toast.success('Updated'); }
      else { await api.post('/admin/problems', d); toast.success('Created'); }
      setOpen(false); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/admin/problems/${id}`); toast.success('Deleted'); refetch(); } catch { toast.error('Failed'); } };

  const list = (data || []).filter(p => (p.title.toLowerCase().includes(search.toLowerCase())) && (!diff || p.difficulty === diff));

  return (
    <>
      <div className="header">
        <h1>Problems</h1>
        <div className="header-actions">
          <div className="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="select" value={diff} onChange={e => setDiff(e.target.value)} style={{ width: 120, flexShrink: 0 }}><option value="">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
          <button className="btn btn-primary" onClick={openCreate}>+ Create</button>
        </div>
      </div>
      <div className="body">
        <div className="card">
          {loading ? <div className="loading-page"><div className="spinner" /></div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Title</th><th>Difficulty</th><th>Submissions</th><th>Actions</th></tr></thead>
              <tbody>
                {list.length === 0 ? <tr><td colSpan={4} className="empty">No problems</td></tr> :
                  list.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.title}</td>
                      <td><span className={`badge badge-${p.difficulty}`}>{p.difficulty}</span></td>
                      <td>{p._count?.submissions || 0}</td>
                      <td><div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => del(p.id)}>Del</button>
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit Problem' : 'Create Problem'}
        footer={<><button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <form>
          <div className="field"><label>Title</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="field"><label>Description</label><textarea className="textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3} /></div>
          <div className="field"><label>Difficulty</label><select className="select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
          <div className="field"><label>Example Input</label><textarea className="textarea" value={form.examples.input} onChange={e => setForm({ ...form, examples: { ...form.examples, input: e.target.value } })} rows={2} /></div>
          <div className="field"><label>Example Output</label><textarea className="textarea" value={form.examples.output} onChange={e => setForm({ ...form, examples: { ...form.examples, output: e.target.value } })} rows={2} /></div>
        </form>
      </Modal>
    </>
  );
}
