import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import TierCard from './components/TierCard';
import Heatmap from './components/Heatmap';
import ScoreTrend from './components/ScoreTrend';
import Achievements from './components/Achievements';
import CompareModal from './components/CompareModal';
import MentorBadge from './components/MentorBadge';

const LANG_COLORS = {
  javascript: '#f1e05a', python: '#3572A5', java: '#b07219',
  cpp: '#f34b7d', c: '#555555', other: '#8b8b8b',
};

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', year: user?.year || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [showCompare, setShowCompare] = useState(false);

  // Gamification data
  const [tier, setTier] = useState(null);
  const [streak, setStreak] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [achievementsData, setAchievementsData] = useState(null);
  const [mentor, setMentor] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/student/profile'),
      api.get('/student/achievements/tier').catch(() => null),
      api.get('/student/achievements/streak').catch(() => null),
      api.get('/student/achievements/heatmap').catch(() => null),
      api.get('/student/achievements/score-history').catch(() => null),
      api.get('/student/achievements').catch(() => null),
      api.get('/student/achievements/mentor').catch(() => null),
    ]).then(([profile, tierR, streakR, heatR, histR, achR, mentorR]) => {
      setProfileData(profile.data.data);
      if (tierR?.data?.data) setTier(tierR.data.data);
      if (streakR?.data?.data) setStreak(streakR.data.data);
      if (heatR?.data?.data) setHeatmap(heatR.data.data);
      if (histR?.data?.data) setScoreHistory(histR.data.data);
      if (achR?.data?.data) setAchievementsData(achR.data.data);
      if (mentorR?.data?.data) setMentor(mentorR.data.data);
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setFetching(false));
  }, []);

  const p = profileData || {};
  const avgScore = p.avgScore ?? 0;
  const bestScore = p.bestScore ?? 0;
  const rank = p.rank;
  const totalLivePoints = p.totalLivePoints ?? 0;
  const languages = p.languages || [];
  const recentSubs = p.recentSubmissions || [];
  const createdAt = p.created_at ? new Date(p.created_at) : null;
  const memberDays = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / 86400000) : 0;

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.put('/student/profile', form);
      updateUser(r.data.data);
      setProfileData(prev => ({ ...prev, ...r.data.data }));
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords mismatch');
    setLoading(true);
    try {
      await api.put('/student/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="loading-page"><div className="spinner" /></div>;

  const sc = avgScore;
  const scClass = sc >= 80 ? 'score-high' : sc >= 60 ? 'score-mid' : sc >= 40 ? 'score-low' : 'score-bad';

  return (
    <>
      <div className="header"><h1>My Profile</h1></div>
      <div className="body">
        {/* ─── Hero Banner ─── */}
        <div className="profile-hero">
          <div className="profile-hero-left">
            <div className="profile-avatar profile-avatar-lg">
              {user?.name?.[0]?.toUpperCase()}
              {rank && <div className="profile-rank-badge">#{rank}</div>}
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: 2 }}>{user?.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 6 }}>{user?.email}</p>
              <div className="profile-meta-row">
                {user?.department && <span className="profile-meta-chip">{user.department}</span>}
                {user?.year && <span className="profile-meta-chip">{user.year}</span>}
                {createdAt && <span className="profile-meta-chip">Joined {createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                {streak && streak.current > 0 && <span className="profile-meta-chip" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)' }}>🔥 {streak.current} day streak</span>}
              </div>
            </div>
          </div>
          {mentor?.isMentor && <MentorBadge mentor={mentor} />}
        </div>

        {/* ─── Stat Cards ─── */}
        <div className="grid g4" style={{ marginBottom: 24 }}>
          <div className="card stat profile-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(166,227,161,0.15)', color: '#a6e3a1' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div className="stat-value">{p.problems_solved || 0}</div>
            <div className="stat-label">Problems Solved</div>
          </div>
          <div className="card stat profile-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(137,180,250,0.15)', color: '#89b4fa' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            </div>
            <div className="stat-value">{rank != null ? `#${rank}` : '—'}</div>
            <div className="stat-label">Leaderboard Rank</div>
          </div>
          <div className="card stat profile-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div className="stat-value">{p.total_points || 0}</div>
            <div className="stat-label">Total Points</div>
          </div>
          <div className="card stat profile-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(243,139,168,0.15)', color: '#f38ba8' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div className="stat-value">{totalLivePoints}</div>
            <div className="stat-label">Live Session Points</div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          {['overview', 'achievements', 'analytics', 'settings'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── Overview Tab ─── */}
        {tab === 'overview' && (
          <div className="profile-grid-2">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 20px' }}>
              <div className={`score-circle ${scClass}`} style={{ width: 100, height: 100, fontSize: '2rem' }}>{avgScore}</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Average AI Score</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {sc >= 80 ? '⭐ Excellent coder' : sc >= 60 ? '👍 Good progress' : sc > 0 ? '📈 Keep practicing' : '🚀 Start solving problems'}
                </div>
              </div>
              {streak && (
                <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>🔥 {streak.current}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Current Streak</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>⚡ {streak.best}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Best Streak</div>
                  </div>
                </div>
              )}
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <div className="profile-mini-stat">
                  <span className="profile-mini-label">Best Score</span>
                  <span className="profile-mini-value">{bestScore}%</span>
                </div>
                <div className="profile-mini-stat">
                  <span className="profile-mini-label">Submissions</span>
                  <span className="profile-mini-value">{p.totalSubmissions || 0}</span>
                </div>
                <div className="profile-mini-stat">
                  <span className="profile-mini-label">Member For</span>
                  <span className="profile-mini-value">{memberDays}d</span>
                </div>
                <div className="profile-mini-stat">
                  <span className="profile-mini-label">Total Points</span>
                  <span className="profile-mini-value">{p.total_points || 0}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px 20px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                Languages Used
              </h3>
              {languages.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No submissions yet. Start solving problems!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {languages.map(lang => {
                    const maxCount = Math.max(...languages.map(l => l.count));
                    const pct = maxCount > 0 ? (lang.count / maxCount) * 100 : 0;
                    return (
                      <div key={lang.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[lang.name] || '#888', display: 'inline-block' }} />
                            {lang.name}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lang.count} submissions</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--surface-hover, rgba(255,255,255,0.05))', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: LANG_COLORS[lang.name] || '#888', borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button className="btn btn-sm btn-outline" style={{ marginTop: 14, width: '100%' }} onClick={() => setShowCompare(true)}>
                ⚔️ Compare with Others
              </button>
            </div>
          </div>
        )}

        {/* ─── Achievements Tab ─── */}
        {tab === 'achievements' && (
          <div className="profile-grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TierCard tier={tier} />
              <Heatmap data={heatmap} />
            </div>
            <Achievements achievements={achievementsData?.achievements} totalEarned={achievementsData?.totalEarned || 0} />
          </div>
        )}

        {/* ─── Analytics Tab ─── */}
        {tab === 'analytics' && (
          <div className="profile-grid-2">
            <ScoreTrend history={scoreHistory} />
            <div className="card" style={{ padding: '20px 20px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Recent Activity
              </h3>
              {recentSubs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No recent submissions.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentSubs.map(s => (
                    <div key={s.id} className="profile-activity-row">
                      <span className="profile-activity-lang" style={{ color: LANG_COLORS[s.language] || '#888' }}>{s.language}</span>
                      <span className="profile-activity-score" style={{ color: (s.ai_score || 0) >= 70 ? '#a6e3a1' : (s.ai_score || 0) >= 50 ? '#f9e2af' : '#f38ba8' }}>
                        {s.ai_score || 0}%
                      </span>
                      <span className="profile-activity-date">{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn btn-sm btn-outline" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/problems')}>
                Solve More Problems →
              </button>
            </div>
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {tab === 'settings' && (
          <div className="profile-grid-2">
            <div className="card" style={{ padding: '20px 20px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14 }}>Edit Profile</h3>
              <form onSubmit={saveProfile}>
                {['name', 'department', 'year'].map(f => (
                  <div className="field" key={f}>
                    <label>{f[0].toUpperCase() + f.slice(1)}</label>
                    <input className="input" value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />
                  </div>
                ))}
                <button className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
            <div className="card" style={{ padding: '20px 20px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14 }}>Change Password</h3>
              <form onSubmit={changePw}>
                {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirm', 'Confirm Password']].map(([k, l]) => (
                  <div className="field" key={k}>
                    <label>{l}</label>
                    <input className="input" type="password" value={pwForm[k]} onChange={e => setPwForm({ ...pwForm, [k]: e.target.value })} />
                  </div>
                ))}
                <button className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showCompare && <CompareModal onClose={() => setShowCompare(false)} />}
    </>
  );
}
