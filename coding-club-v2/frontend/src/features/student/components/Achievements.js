import React from 'react';

const CATEGORY_LABELS = { milestone: 'Milestone', score: 'Score', diversity: 'Diversity', streak: 'Streak', leaderboard: 'Leaderboard', points: 'Points', difficulty: 'Difficulty', special: 'Special' };

const TIER_COLORS = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#e5e4e2', diamond: '#b9f2ff' };

export default function Achievements({ achievements, totalEarned }) {
  if (!achievements || achievements.length === 0) {
    return (
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
          Achievements
        </h3>
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No achievements defined yet.</p>
      </div>
    );
  }

  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
        Achievements
      </h3>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
        <strong style={{ color: '#a6e3a1' }}>{totalEarned}</strong> earned / {achievements.length} total
      </div>

      {earned.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Earned</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {earned.map(a => (
              <div key={a.id} className="achievement-badge earned" style={{
                padding: '12px 10px', borderRadius: 10, textAlign: 'center',
                background: 'rgba(166,227,161,0.08)', border: '1px solid rgba(166,227,161,0.3)',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{a.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{a.description}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                    background: TIER_COLORS[a.tier] + '22', color: TIER_COLORS[a.tier], border: `1px solid ${TIER_COLORS[a.tier]}44`,
                  }}>
                    {a.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Locked</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {locked.map(a => (
              <div key={a.id} className="achievement-badge locked" style={{
                padding: '12px 10px', borderRadius: 10, textAlign: 'center',
                background: 'var(--surface-hover)', border: '1px solid var(--border)', opacity: 0.6,
                filter: 'grayscale(0.5)',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{a.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{a.description}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                    background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                  }}>
                    {a.tier} • +{a.points}pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
