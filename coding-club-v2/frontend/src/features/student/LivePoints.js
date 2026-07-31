import React from 'react';
import { useFetch } from '../../hooks/useFetch';

export default function LivePoints() {
  const { data, loading } = useFetch('/student/live-points');

  return (
    <>
      <div className="header"><h1>Live Session Points</h1></div>
      <div className="body">
        <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="stat-value" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>{data?.totalLivePoints || 0}</div>
          <div className="stat-label">Total Live Points</div>
        </div>
        {loading ? <div className="loading-page"><div className="spinner" /></div> :
          (!data?.sessions || data.sessions.length === 0) ? <div className="empty">No sessions yet</div> : (
            <div className="grid g2">
              {data.sessions.map(s => (
                <div className="session-card" key={s.id}>
                  <div className="session-header">
                    <div><h3 style={{ fontWeight: 600 }}>{s.session?.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.session?.date).toLocaleDateString()}</p></div>
                    <div className="session-pts">+{s.points}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}
