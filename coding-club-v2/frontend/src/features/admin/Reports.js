import React from 'react';
import { useFetch } from '../../hooks/useFetch';

export default function Reports() {
  const { data, loading } = useFetch('/admin/reports');
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <>
      <div className="header"><h1>Reports</h1></div>
      <div className="body">
        <div className="grid g4" style={{ marginBottom: 24 }}>
          {[['Students', data?.totalStudents || 0], ['Problems', data?.totalProblems || 0], ['Submissions', data?.totalSubmissions || 0], ['Avg Score', data?.averageAiScore || 0]].map(([l, v]) => (
            <div className="card stat" key={l}><div><div className="stat-value">{v}</div><div className="stat-label">{l}</div></div></div>
          ))}
        </div>
        <div className="grid-1-1">
          <div className="card">
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12 }}>Activity</h3>
            <div className="flex-stat-row">
              <div className="card stat" style={{ flex: 1 }}><div><div className="stat-value">{data?.todayActivity || 0}</div><div className="stat-label">Today</div></div></div>
              <div className="card stat" style={{ flex: 1 }}><div><div className="stat-value">{data?.weeklyActivity || 0}</div><div className="stat-label">This Week</div></div></div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12 }}>Top Students</h3>
            <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Name</th><th>Score</th></tr></thead>
              <tbody>
                {(!data?.topStudents || data.topStudents.length === 0) ? <tr><td colSpan={3} className="empty">No data</td></tr> :
                  data.topStudents.slice(0, 5).map((e, i) => (
                    <tr key={e.student?.id}><td><span className={`rank ${i < 3 ? `rank-${i + 1}` : 'rank-n'}`}>{i + 1}</span></td>
                    <td style={{ fontWeight: 500 }}>{e.student?.name}</td><td style={{ fontWeight: 600 }}>{e.total_score}</td></tr>
                  ))}
              </tbody>
            </table></div>
          </div>
        </div>
      </div>
    </>
  );
}
