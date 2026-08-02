import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const MINI_COLORS = ['#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8', '#cba6f7'];

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setAnalytics(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const a = analytics || {};

  return (
    <>
      <div className="header">
        <h1>Admin Dashboard</h1>
        <button className="btn btn-outline btn-sm" onClick={() => nav('/admin/reports')}>
          Full Analytics →
        </button>
      </div>
      <div className="body">
        {/* ─── Summary Stats ─── */}
        <div className="grid g4" style={{ marginBottom: 24 }}>
          {[
            ['Students', a.totalStudents || 0, '#89b4fa', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'],
            ['Problems', a.totalProblems || 0, '#a6e3a1', 'M16 18l2-2-2-2M8 18l-2-2 2-2M14 4l-4 16'],
            ['Submissions', a.totalSubmissions || 0, '#f9e2af', 'M22 12h-4l-3 9L9 3l-3 9H2'],
            ['Avg Score', `${a.averageAiScore || 0}%`, '#cba6f7', 'M12 20V10M18 20V4M6 20v-4'],
          ].map(([label, val, color, path]) => (
            <div className="card stat" key={label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <div className="stat-icon" style={{ background: `${color}18`, color }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={path} />
                </svg>
              </div>
              <div className="stat-value">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* ─── Mini Charts Row ─── */}
        {a.submissionsOverTime && a.submissionsOverTime.length > 0 && (
          <div className="analytics-grid-3" style={{ marginBottom: 24 }}>
            {/* Activity Trend */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
                Activity Trend
              </h3>
              <div style={{ width: '100%', height: 120 }}>
                <ResponsiveContainer>
                  <AreaChart data={a.submissionsOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#89b4fa" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#89b4fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                      labelStyle={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}
                    />
                    <Area type="monotone" dataKey="submissions" stroke="#89b4fa" strokeWidth={2} fill="url(#miniGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Last 30 days
              </div>
            </div>

            {/* Language Mini Pie */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
                Languages Used
              </h3>
              {(!a.languageUsage || a.languageUsage.length === 0) ? (
                <div className="empty" style={{ padding: '20px 0' }}>No data</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 120 }}>
                  <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={a.languageUsage} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" stroke="none">
                          {a.languageUsage.map((_, i) => <Cell key={i} fill={MINI_COLORS[i % MINI_COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {a.languageUsage.slice(0, 4).map((lang, i) => (
                      <div key={lang.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: MINI_COLORS[i % MINI_COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{lang.name}</span>
                        <span style={{ fontWeight: 600 }}>{lang.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Difficulty Mini Bar */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
                Difficulty Split
              </h3>
              {(!a.difficultyBreakdown || a.difficultyBreakdown.length === 0) ? (
                <div className="empty" style={{ padding: '20px 0' }}>No data</div>
              ) : (
                <>
                  <div style={{ width: '100%', height: 100 }}>
                    <ResponsiveContainer>
                      <BarChart data={a.difficultyBreakdown} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                        />
                        <Bar dataKey="submissions" radius={[4, 4, 0, 0]} maxBarSize={36}>
                          {a.difficultyBreakdown.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {a.difficultyBreakdown.map(d => (
                      <div key={d.name} style={{
                        flex: 1, textAlign: 'center', padding: '4px 0',
                        background: `${d.fill}12`, borderRadius: 4, fontSize: '0.72rem',
                      }}>
                        <span style={{ fontWeight: 700, color: d.fill }}>{d.submissions}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 3 }}>{d.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── Bottom Row: Top Students + Quick Actions ─── */}
        <div className="analytics-grid-bottom">
          <div className="card">
            <div className="card-header-flex">
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Top Students</h3>
              <button className="btn btn-sm btn-outline" onClick={() => nav('/admin/reports')}>View All</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Rank</th><th>Name</th><th>Score</th></tr>
                </thead>
                <tbody>
                  {(!a.topPerformers || a.topPerformers.length === 0) ? (
                    <tr><td colSpan={3} className="empty">No data</td></tr>
                  ) : a.topPerformers.slice(0, 5).map((e) => (
                    <tr key={e.name}>
                      <td>
                        <span className={`rank ${e.rank <= 3 ? `rank-${e.rank}` : 'rank-n'}`}>{e.rank}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{e.name}</td>
                      <td style={{ fontWeight: 600 }}>{e.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => nav('/admin/students')}>Manage Students</button>
              <button className="btn btn-outline" onClick={() => nav('/admin/problems')}>Manage Problems</button>
              <button className="btn btn-outline" onClick={() => nav('/admin/sessions')}>Sessions</button>
              <button className="btn btn-outline" onClick={() => nav('/admin/reports')}>View Analytics</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
