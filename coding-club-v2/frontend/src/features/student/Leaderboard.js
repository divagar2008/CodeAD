import React from 'react';
import { useFetch } from '../../hooks/useFetch';

const MEDAL_CONFIG = {
  1: {
    gradient: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)',
    shadow: '0 3px 14px rgba(245, 158, 11, 0.45)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  2: {
    gradient: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)',
    shadow: '0 3px 12px rgba(156, 163, 175, 0.4)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  3: {
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)',
    shadow: '0 3px 12px rgba(217, 119, 6, 0.4)',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
};

function RankBadge({ rank }) {
  const medal = MEDAL_CONFIG[rank];
  if (medal) {
    return (
      <span
        className="rank-medal"
        style={{
          background: medal.gradient,
          boxShadow: medal.shadow,
        }}
      >
        {medal.icon}
        <span className="rank-medal-num">{rank}</span>
      </span>
    );
  }
  return <span className="rank rank-n">{rank}</span>;
}

const PODIUM_STYLES = {
  1: { gradient: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)', height: 140, medalSize: 46, fontSize: '1.1rem', shadow: '0 6px 24px rgba(245,158,11,0.4)' },
  2: { gradient: 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 50%, #9ca3af 100%)', height: 110, medalSize: 40, fontSize: '0.95rem', shadow: '0 6px 20px rgba(156,163,175,0.35)' },
  3: { gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)', height: 90, medalSize: 38, fontSize: '0.9rem', shadow: '0 6px 20px rgba(217,119,6,0.35)' },
};

function PodiumCard({ student, rank }) {
  const style = PODIUM_STYLES[rank];
  if (!style || !student) return null;
  const medal = MEDAL_CONFIG[rank];
  const initial = student.student?.name?.[0]?.toUpperCase() || '?';

  return (
    <div className="podium-card" style={{ order: rank === 1 ? 2 : rank === 2 ? 1 : 3 }}>
      <div className="podium-avatar" style={{
        background: medal.gradient,
        width: style.medalSize, height: style.medalSize,
        boxShadow: style.shadow,
      }}>
        {initial}
      </div>
      <div className="podium-name" style={{ fontSize: style.fontSize }}>{student.student?.name}</div>
      <div className="podium-score">{student.total_score} pts</div>
      <div className="podium-stand" style={{
        height: style.height,
        background: style.gradient,
      }}>
        <span className="podium-rank">#{rank}</span>
      </div>
    </div>
  );
}

function Podium({ top3 }) {
  if (!top3 || top3.length === 0) return null;
  const byRank = {};
  top3.forEach(e => { byRank[e.rank] = e; });

  return (
    <div className="podium-container">
      <div className="podium-stage">
        <PodiumCard student={byRank[2]} rank={2} />
        <PodiumCard student={byRank[1]} rank={1} />
        <PodiumCard student={byRank[3]} rank={3} />
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data, loading } = useFetch('/student/leaderboard');
  const hasScores = data && data.some(e => e.total_score > 0);
  const top3 = hasScores ? data.filter(e => e.rank <= 3 && e.total_score > 0) : [];

  return (
    <>
      <div className="header"><h1>Leaderboard</h1></div>
      <div className="body">
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : (
          <>
            {top3.length > 0 && <Podium top3={top3} />}
            <div className="card">
              <div className="table-wrap"><table>
                <thead><tr><th>Rank</th><th>Student</th><th>Department</th><th>Coding</th><th>Live</th><th>Total</th></tr></thead>
                <tbody>
                  {(!data || data.length === 0) ? <tr><td colSpan={6} className="empty">No data yet</td></tr> :
                    data.map(e => (
                      <tr key={e.student?.id} className={e.rank <= 3 ? `leaderboard-top-${e.rank}` : ''}>
                        <td><RankBadge rank={e.rank} /></td>
                        <td style={{ fontWeight: 500 }}>
                          {e.student?.name}
                          {e.rank <= 3 && <span className="rank-title">#{e.rank}</span>}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{e.student?.department || '-'}</td>
                        <td>{e.coding_score}</td>
                        <td>{e.live_session_pts}</td>
                        <td style={{ fontWeight: 600 }}>{e.total_score}</td>
                      </tr>
                    ))}
                </tbody>
              </table></div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
