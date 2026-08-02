import React from 'react';

export default function ScoreTrend({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Score Trend
        </h3>
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No submission history yet.</p>
      </div>
    );
  }

  const width = 400, height = 140, padX = 36, padY = 16;
  const plotW = width - padX * 2, plotH = height - padY * 2;

  const maxScore = 100;
  const points = history.map((h, i) => ({
    x: padX + (i / Math.max(1, history.length - 1)) * plotW,
    y: padY + plotH - (h.score / maxScore) * plotH,
    score: h.score,
    date: h.date,
    lang: h.language,
  }));

  // Cumulative line
  const maxCum = Math.max(...history.map(h => h.cumulative), 1);
  const cumPoints = history.map((h, i) => ({
    x: padX + (i / Math.max(1, history.length - 1)) * plotW,
    y: padY + plotH - (h.cumulative / maxCum) * plotH,
    cumulative: h.cumulative,
    date: h.date,
  }));

  const scorePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const cumPath = cumPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const scoreAreaPath = scorePath + ` L ${points[points.length - 1].x} ${padY + plotH} L ${points[0].x} ${padY + plotH} Z`;
  const cumAreaPath = cumPath + ` L ${cumPoints[cumPoints.length - 1].x} ${padY + plotH} L ${cumPoints[0].x} ${padY + plotH} Z`;

  const avg = Math.round(history.reduce((s, h) => s + h.score, 0) / history.length);

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Score Trend
      </h3>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>Avg: <strong style={{ color: 'var(--text)' }}>{avg}%</strong></span>
        <span>Latest: <strong style={{ color: 'var(--text)' }}>{history[history.length - 1]?.score || 0}%</strong></span>
        <span>Total: <strong style={{ color: 'var(--text)' }}>{history[history.length - 1]?.cumulative || 0}</strong></span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = padY + plotH - (v / maxScore) * plotH;
          return (
            <g key={v}>
              <line x1={padX} y1={y} x2={padX + plotW} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
              <text x={padX - 4} y={y + 3} textAnchor="end" fontSize="8" fill="var(--text-muted)">{v}</text>
            </g>
          );
        })}
        {/* Score area */}
        <path d={scoreAreaPath} fill="rgba(137,180,250,0.1)" />
        <path d={scorePath} fill="none" stroke="#89b4fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Cumulative area */}
        <path d={cumAreaPath} fill="rgba(166,227,161,0.05)" />
        <path d={cumPath} fill="none" stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#89b4fa" stroke="var(--surface)" strokeWidth="1.5"
            style={{ cursor: 'pointer' }}>
            <title>{p.date}: {p.score}% ({p.lang})</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 2, background: '#89b4fa', display: 'inline-block', borderRadius: 1 }} /> Per-submission score
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 2, background: '#a6e3a1', display: 'inline-block', borderRadius: 1, borderTop: '1px dashed #a6e3a1' }} /> Cumulative score
        </span>
      </div>
    </div>
  );
}
