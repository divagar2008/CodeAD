import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function CompareModal({ onClose }) {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/student/achievements/compare-list').then(r => setStudents(r.data.data)).catch(() => {});
  }, []);

  const doCompare = async (id) => {
    setSelectedId(id);
    setLoading(true);
    try {
      const r = await api.get(`/student/achievements/compare/${id}`);
      setCompareData(r.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const me = compareData?.me;
  const other = compareData?.other;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Compare Stats</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {!compareData ? (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>Select a student to compare with:</p>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {students.map(s => (
                  <div key={s.studentId} onClick={() => doCompare(s.studentId)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    borderRadius: 'var(--radius)', cursor: 'pointer', border: '1px solid var(--border)',
                    marginBottom: 6, transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--text)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                      {s.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.department || 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.totalScore}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>pts</div>
                    </div>
                  </div>
                ))}
                {students.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students to compare with.</p>}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'start' }}>
                {/* Me */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--text)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', margin: '0 auto 8px' }}>
                    {me?.name?.[0]}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>You</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)', paddingTop: 16 }}>vs</div>
                {/* Other */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--text)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', margin: '0 auto 8px' }}>
                    {other?.name?.[0]}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{other?.name}</div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                {[
                  ['Total Points', me?.total_points, other?.total_points],
                  ['Coding Score', me?.coding_score, other?.coding_score],
                  ['Problems Solved', me?.problems_solved, other?.problems_solved],
                ].map(([label, a, b]) => {
                  const max = Math.max(a || 0, b || 0, 1);
                  return (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 4 }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, textAlign: 'right', fontWeight: 700, fontSize: '1.05rem' }}>{a || 0}</div>
                        <div style={{ flex: 2 }}>
                          <div style={{ display: 'flex', height: 8, borderRadius: 100, overflow: 'hidden', background: 'var(--surface-hover)' }}>
                            <div style={{ width: `${((a || 0) / max) * 100}%`, background: '#89b4fa', borderRadius: '100px 0 0 100px', transition: 'width 0.5s' }} />
                            <div style={{ width: `${((b || 0) / max) * 100}%`, background: '#f38ba8', borderRadius: '0 100px 100px 0', transition: 'width 0.5s' }} />
                          </div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: '1.05rem' }}>{b || 0}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setCompareData(null); setSelectedId(null); }}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>Close</button>
              </div>
            </>
          )}
          {loading && <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" /></div>}
        </div>
      </div>
    </div>
  );
}
