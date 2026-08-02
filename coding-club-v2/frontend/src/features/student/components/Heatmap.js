import React from 'react';

const LEVELS = [0, 1, 2, 3, 4];
const LEVEL_COLORS = ['var(--surface-hover, #ebedf0)', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const LEVEL_COLORS_DARK = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

export default function Heatmap({ data }) {
  if (!data || data.length === 0) return null;

  const theme = document.documentElement.getAttribute('data-theme');
  const colors = theme === 'dark' ? LEVEL_COLORS_DARK : LEVEL_COLORS;

  // Group by week (columns)
  const weeks = [];
  let currentWeek = [];
  const startDate = new Date(data[0].date);
  const startDay = startDate.getDay();

  // Pad first week
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  data.forEach(d => {
    const date = new Date(d.date);
    if (date.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(d);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getColor = (count) => {
    if (count === 0) return colors[0];
    if (count === 1) return colors[1];
    if (count === 2) return colors[2];
    if (count <= 4) return colors[3];
    return colors[4];
  };

  const totalSubs = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter(d => d.count > 0).length;
  const maxCount = Math.max(...data.map(d => d.count), 0);

  // Month labels
  const months = [];
  let lastMonth = -1;
  data.forEach((d, i) => {
    const month = new Date(d.date).getMonth();
    if (month !== lastMonth) {
      months.push({ label: new Date(d.date).toLocaleString('default', { month: 'short' }), index: i });
      lastMonth = month;
    }
  });

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Activity Heatmap
      </h3>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span><strong style={{ color: 'var(--text)' }}>{totalSubs}</strong> submissions</span>
        <span><strong style={{ color: 'var(--text)' }}>{activeDays}</strong> active days</span>
        <span><strong style={{ color: 'var(--text)' }}>{maxCount}</strong> max in a day</span>
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        {/* Month labels */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 4, marginLeft: 28 }}>
          {months.map((m, i) => (
            <div key={i} style={{
              fontSize: '0.65rem', color: 'var(--text-muted)', position: 'relative',
              width: `${Math.max(12, (weeks.length / months.length) * 13)}px`,
            }}>
              {m.label}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4 }}>
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
              <div key={i} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', height: 11, lineHeight: '11px', textAlign: 'right' }}>{d}</div>
            ))}
          </div>
          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Array.from({ length: 7 }, (_, di) => {
                const cell = week.find((_, ci) => {
                  const cellDate = week[ci] ? new Date(week[ci].date) : null;
                  return cellDate && cellDate.getDay() === di;
                });
                return (
                  <div
                    key={di}
                    title={cell ? `${cell.date}: ${cell.count} submissions` : 'No data'}
                    style={{
                      width: 11, height: 11, borderRadius: 2,
                      background: cell ? getColor(cell.count) : 'transparent',
                      border: cell ? 'none' : '1px dashed var(--border)',
                      transition: 'transform 0.1s',
                      cursor: cell ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => { if (cell) e.target.style.transform = 'scale(1.4)'; }}
                    onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Less</span>
        {colors.map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
        ))}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  );
}
