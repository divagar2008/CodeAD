import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';

export default function Dashboard() {
  const { data, loading } = useFetch('/student/dashboard');
  const navigate = useNavigate();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  const s = data?.student;
  const subs = data?.recentSubmissions || [];

  return (
    <>
      <div className="header"><h1>Welcome, {s?.name}</h1></div>
      <div className="body">
        <div className="grid g4" style={{ marginBottom: 24 }}>
          {[
            ['Problems Solved', s?.problems_solved || 0],
            ['Coding Score', s?.coding_score || 0],
            ['Total Points', s?.total_points || 0],
            ['Available', data?.totalProblems || 0],
          ].map(([label, val]) => (
            <div className="card stat" key={label}>
              <div><div className="stat-value">{val}</div><div className="stat-label">{label}</div></div>
            </div>
          ))}
        </div>
        <div className="grid-2-1">
          <div className="card">
            <div className="card-header-flex">
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Recent Submissions</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/problems')}>Solve more</button>
            </div>
            {subs.length === 0 ? <p className="empty">No submissions yet</p> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Problem</th>
                      <th>Lang</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map(s => (
                      <tr key={s.id}>
                        <td className="cell-title">{s.problem?.title}</td>
                        <td><span className="badge badge-easy">{s.language}</span></td>
                        <td style={{ fontWeight: 600 }}>{s.ai_score || 0}%</td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => navigate('/problems')}>Solve Problems</button>
              <button className="btn btn-outline" onClick={() => navigate('/leaderboard')}>Leaderboard</button>
              <button className="btn btn-outline" onClick={() => navigate('/profile')}>Profile</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
