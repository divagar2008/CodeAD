import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import toast from 'react-hot-toast';

export default function Problems() {
  const { data, loading } = useFetch('/student/problems');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const problems = data?.problems || [];
  const unlocked = data?.unlocked || { easy: true, medium: false, hard: false };
  const progress = data?.progress || { easy: { total: 0, solved: 0 }, medium: { total: 0, solved: 0 }, hard: { total: 0, solved: 0 } };
  const solvedIds = new Set(data?.solvedProblemIds || []);

  const difficultyOrder = ['easy', 'medium', 'hard'];
  const difficultyLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

  // Find the next locked level to show progress towards unlocking
  const nextLocked = difficultyOrder.find(d => !unlocked[d]);
  const prevOfLocked = nextLocked === 'medium' ? 'easy' : nextLocked === 'hard' ? 'medium' : null;

  const filtered = problems.filter(p => {
    const matchFilter = filter === 'all' ? unlocked[p.difficulty] : p.difficulty === filter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleTabClick = (f) => {
    if (f !== 'all' && !unlocked[f]) {
      const prev = f === 'medium' ? 'easy' : 'medium';
      toast.error(`Complete all ${prev} problems to unlock ${f}!`);
      return;
    }
    setFilter(f);
  };

  const handleProblemClick = (p) => {
    if (!unlocked[p.difficulty]) {
      const prev = p.difficulty === 'medium' ? 'easy' : 'medium';
      toast.error(`Complete all ${prev} problems to unlock ${p.difficulty}!`);
      return;
    }
    navigate(`/problems/${p.id}`);
  };

  return (
    <>
      <div className="header">
        <h1>Solve Problems</h1>
        <div className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="body">
        {/* Progress Banner */}
        {prevOfLocked && progress[prevOfLocked] && (
          <div className="level-progress-banner">
            <div className="level-progress-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>
                Solve <strong>{progress[prevOfLocked].total - progress[prevOfLocked].solved}</strong> more {prevOfLocked} problem{progress[prevOfLocked].total - progress[prevOfLocked].solved !== 1 ? 's' : ''} to unlock <strong>{difficultyLabels[nextLocked]}</strong>
              </span>
            </div>
            <div className="level-progress-bar">
              <div
                className="level-progress-fill"
                style={{ width: `${progress[prevOfLocked].total > 0 ? (progress[prevOfLocked].solved / progress[prevOfLocked].total) * 100 : 0}%` }}
              />
            </div>
            <div className="level-progress-count">
              {progress[prevOfLocked].solved} / {progress[prevOfLocked].total} completed
            </div>
          </div>
        )}

        {/* Difficulty Tabs */}
        <div className="tabs">
          <button
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >All</button>
          {difficultyOrder.map(f => {
            const isLocked = !unlocked[f];
            return (
              <button
                key={f}
                className={`tab ${filter === f ? 'active' : ''} ${isLocked ? 'tab-locked' : ''}`}
                onClick={() => handleTabClick(f)}
              >
                {isLocked && (
                  <svg className="lock-icon-inline" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
                {difficultyLabels[f]}
                <span className="tab-count">{progress[f]?.solved || 0}/{progress[f]?.total || 0}</span>
              </button>
            );
          })}
        </div>

        {/* Problem Cards */}
        {loading ? <div className="loading-page"><div className="spinner" /></div> : filtered.length === 0 ? (
          <div className="empty">No problems found</div>
        ) : (
          <div className="grid g2">
            {filtered.map(p => {
              const isLocked = !unlocked[p.difficulty];
              const isSolved = solvedIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`problem-card ${isLocked ? 'problem-card-locked' : ''} ${isSolved ? 'problem-card-solved' : ''}`}
                  onClick={() => handleProblemClick(p)}
                >
                  {isLocked && (
                    <div className="problem-lock-overlay">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <span>Locked</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                    <h3>{p.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isSolved && (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          Solved
                        </span>
                      )}
                      <span className={`badge badge-${p.difficulty}`}>{p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)}</span>
                    </div>
                  </div>
                  <p>{p.description}</p>
                  <div className="problem-footer"><span>{new Date(p.created_at).toLocaleDateString()}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
