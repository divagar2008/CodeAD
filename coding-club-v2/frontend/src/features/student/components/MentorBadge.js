import React from 'react';

export default function MentorBadge({ mentor }) {
  if (!mentor || !mentor.isMentor) return null;

  const tierStyles = {
    Grandmaster: { bg: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(245,158,11,0.1))', border: 'rgba(255,215,0,0.4)', color: '#ffd700', icon: '👑' },
    Master: { bg: 'linear-gradient(135deg, rgba(185,242,255,0.15), rgba(137,180,250,0.1))', border: 'rgba(185,242,255,0.4)', color: '#b9f2ff', icon: '💎' },
    Expert: { bg: 'linear-gradient(135deg, rgba(166,227,161,0.15), rgba(137,220,143,0.1))', border: 'rgba(166,227,161,0.4)', color: '#a6e3a1', icon: '🎓' },
  };

  const style = tierStyles[mentor.mentorTier] || tierStyles.Expert;

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
