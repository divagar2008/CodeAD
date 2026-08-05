import React from 'react';

export default function MentorBadge({ mentor }) {
  if (!mentor || !mentor.isMentor) return null;

  const tierStyles = {
    'The Champion': { bg: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(245,158,11,0.15))', border: 'rgba(255,215,0,0.5)', color: '#ffd700', icon: '🏆' },
    'The Conqueror': { bg: 'linear-gradient(135deg, rgba(192,192,192,0.2), rgba(156,163,175,0.15))', border: 'rgba(192,192,192,0.5)', color: '#c0c0c0', icon: '⚔️' },
    'The Victor': { bg: 'linear-gradient(135deg, rgba(205,127,50,0.2), rgba(180,83,9,0.1))', border: 'rgba(205,127,50,0.4)', color: '#cd7f32', icon: '🛡️' },
    'Mentor': { bg: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))', border: 'rgba(59,130,246,0.3)', color: '#60a5fa', icon: '💎' },
  };

  const style = tierStyles[mentor.mentorTier] || tierStyles['Mentor'];

  return (
    <div className="card" style={{
      padding: '16px 20px',
      background: style.bg,
      border: `1px solid ${style.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.6rem', background: 'rgba(0,0,0,0.2)',
          border: `2px solid ${style.color}`, flexShrink: 0,
        }}>
          {style.icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: style.color }}>
            {mentor.mentorTier} Mentor
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Ranked <strong>#{mentor.mentorRank}</strong> on the leaderboard
          </div>
        </div>
      </div>
    </div>
  );
}
