import React from 'react';
import { useFetch } from '../../hooks/useFetch';

export default function Leaderboard() {
  const { data, loading } = useFetch('/student/leaderboard');
  const rankClass = r => r === 1 ? 'rank-1' : r === 2 ? 'rank-2' : r === 3 ? 'rank-3' : 'rank-n';

  return (
    <>
      <div className="header"><h1>Leaderboard</h1></div>
      <div className="body">
        <div className="card">
          {loading ? <div className="loading-page"><div className="spinner" /></div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Rank</th><th>Student</th><th>Department</th><th>Coding</th><th>Live</th><th>Total</th></tr></thead>
              <tbody>
                {(!data || data.length === 0) ? <tr><td colSpan={6} className="empty">No data yet</td></tr> :
                  data.map(e => (
                    <tr key={e.student?.id}>
                      <td><span className={`rank ${rankClass(e.rank)}`}>{e.rank}</span></td>
                      <td style={{ fontWeight: 500 }}>{e.student?.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{e.student?.department || '-'}</td>
                      <td>{e.coding_score}</td>
                      <td>{e.live_session_pts}</td>
                      <td style={{ fontWeight: 600 }}>{e.total_score}</td>
                    </tr>
                  ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </>
  );
}
