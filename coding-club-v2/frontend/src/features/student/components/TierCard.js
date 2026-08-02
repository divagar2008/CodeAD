import React from 'react';

export default function TierCard({ tier }) {
  if (!tier) return null;
  const { current, next, progress } = tier;

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Current Tier
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.8rem', background: current.bg, border: `2px solid ${current.color}`,
        }}>
          {current.icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: current.color }}>{current.name}</div>
          {next && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {next.min - (current.min + Math.round(progress * (next.min - current.min) / 100))} pts to {next.name}
            </div>
          )}
          {!next && <div style={{ fontSize: '0.8rem', color: '#a6e3a1' }}>Maximum tier reached! 🎉</div>}
        </div>
      </div>
      <div style={{ height: 8, background: 'var(--surface-hover)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${current.color}, ${next?.color || current.color})`,
          borderRadius: 100, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>{progress}%</div>
    </div>
  );
}
