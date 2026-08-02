import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8', '#cba6f7', '#94e2d5', '#fab387', '#89dceb'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontWeight: 600, color: p.color || 'var(--text)' }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setAnalytics(r.data.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!analytics) return <div className="empty">No analytics data available</div>;

  const a = analytics;

  return (
    <>
      <div className="header">
        <h1>Analytics Dashboard</h1>
      </div>
      <div className="body">
        {/* ─── Summary Stats ─── */}
        <div className="grid g4" style={{ marginBottom: 24 }}>
          {[
            ['Students', a.totalStudents, '#89b4fa', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'],
            ['Problems', a.totalProblems, '#a6e3a1', 'M16 18l2-2-2-2M8 18l-2-2 2-2M14 4l-4 16'],
            ['Submissions', a.totalSubmissions, '#f9e2af', 'M22 12h-4l-3 9L9 3l-3 9H2'],
            ['Avg Score', `${a.averageAiScore}%`, '#cba6f7', 'M12 20V10M18 20V4M6 20v-4'],
          ].map(([label, value, color, path]) => (
            <div className="card stat" key={label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <div className="stat-icon" style={{ background: `${color}18`, color }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={path} />
                </svg>
              </div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* ─── Row 1: Submissions Over Time + Score Distribution ─── */}
        <div className="analytics-grid-2" style={{ marginBottom: 24 }}>
          {/* Submissions Over Time */}
          <div className="card">
            <div className="card-header-flex">
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#89b4fa" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Submissions Over Time
              </h3>
              <span className="analytics-badge">Last 30 Days</span>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={a.submissionsOverTime} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#89b4fa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#89b4fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="submissions" stroke="#89b4fa" strokeWidth={2} fill="url(#gradSubs)" dot={false} activeDot={{ r: 5, fill: '#89b4fa', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="card">
            <div className="card-header-flex">
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cba6f7" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Score Distribution
              </h3>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={a.scoreDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {a.scoreDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ─── Row 2: Language Usage + Difficulty Breakdown ─── */}
        <div className="analytics-grid-2" style={{ marginBottom: 24 }}>
          {/* Language Usage Pie */}
          <div className="card">
            <div className="card-header-flex">
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a6e3a1" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
                Language Usage
              </h3>
            </div>
            {a.languageUsage.length === 0 ? (
              <div className="empty" style={{ padding: '40px 16px' }}>No submissions yet</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: '60%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={a.languageUsage}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {a.languageUsage.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {a.languageUsage.map((lang, i) => (
                    <div key={lang.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, flex: 1 }}>{lang.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{lang.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Difficulty Breakdown */}
          <div className="card">
            <div className="card-header-flex">
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f9e2af" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Difficulty Breakdown
              </h3>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={a.difficultyBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="submissions" name="Submissions" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {a.difficultyBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Difficulty Summary Row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {a.difficultyBreakdown.map(d => (
                <div key={d.name} style={{
                  flex: 1, textAlign: 'center', padding: '8px 0',
                  background: `${d.fill}12`, borderRadius: 6, fontSize: '0.8rem',
                }}>
                  <div style={{ fontWeight: 700, color: d.fill, fontSize: '1.1rem' }}>{d.submissions}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Row 3: Top Performers + Department Breakdown ─── */}
        <div className="analytics-grid-2">
          {/* Top Performers Horizontal Bar */}
          <div className="card">
            <div className="card-header-flex">
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f9e2af" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Top Performers
              </h3>
            </div>
            {a.topPerformers.length === 0 ? (
              <div className="empty" style={{ padding: '40px 16px' }}>No data yet</div>
            ) : (
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer>
                  <BarChart data={a.topPerformers} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="coding" name="Coding Score" stackId="a" fill="#89b4fa" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="live" name="Live Points" stackId="a" fill="#a6e3a1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#89b4fa', display: 'inline-block' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Coding Score</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#a6e3a1', display: 'inline-block' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Live Points</span>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="card">
            <div className="card-header-flex">
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94e2d5" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
                Students by Department
              </h3>
            </div>
            {a.departmentBreakdown.length === 0 ? (
              <div className="empty" style={{ padding: '40px 16px' }}>No students yet</div>
            ) : (
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer>
                  <BarChart data={a.departmentBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {a.departmentBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Summary */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {a.departmentBreakdown.map((d, i) => (
                <div key={d.name} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', background: 'var(--surface-hover)', borderRadius: 100,
                  fontSize: '0.78rem', fontWeight: 500,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span>{d.name}</span>
                  <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
