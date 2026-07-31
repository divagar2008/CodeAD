import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import HamsterLoader from '../../components/ui/HamsterLoader';

const exts = { javascript: [javascript()], python: [python()], java: [java()], cpp: [cpp()], c: [cpp()], other: [javascript()] };
const starters = { javascript: '// Your solution\n', python: '# Your solution\n', java: '// Your solution\n', cpp: '// Your solution\n', c: '// Your solution\n', other: '// Your solution\n' };

export default function ProblemPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(null);

  const [themeMode, setThemeMode] = useState(
    document.documentElement.getAttribute('data-theme') || 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setThemeMode(current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api.get(`/student/problems/${id}`)
      .then(r => {
        setProblem(r.data.data);
        setCode(r.data.data.starter_code || starters.javascript);
      })
      .catch(() => toast.error('Failed to load problem'))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async () => {
    if (!code.trim()) return toast.error('Write some code before submitting');
    setSubmitting(true);
    try {
      const r = await api.post('/student/submit', { problem_id: Number(id), code, language: lang });
      setReview(r.data.data.review);
      if (r.data.data.review?.has_syntax_error) {
        toast.error('Syntax error detected! Check review panel.');
      } else {
        toast.success(`Score: ${r.data.data.review.ai_score}%`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!problem) return <div className="empty"><p>Problem not found</p><button className="btn btn-outline" onClick={() => nav('/problems')}>Back to Problems</button></div>;

  const sc = review?.ai_score || 0;
  const scClass = sc >= 80 ? 'score-high' : sc >= 60 ? 'score-mid' : sc >= 40 ? 'score-low' : 'score-bad';

  let ex = null;
  if (problem?.examples) {
    if (typeof problem.examples === 'object') {
      ex = problem.examples;
    } else if (typeof problem.examples === 'string') {
      try {
        ex = JSON.parse(problem.examples);
        if (typeof ex === 'string') ex = JSON.parse(ex);
      } catch (e) {
        ex = { input: problem.examples, output: '' };
      }
    }
  }

  return (
    <>
      <div className="ide-header">
        <button className="btn btn-sm btn-outline" onClick={() => nav('/problems')}>&larr; Back</button>
        <h1 style={{ flex: 1 }}>{problem.title}</h1>
        <span className={`badge badge-${problem.difficulty}`}>{problem.difficulty}</span>
        <select className="select" value={lang} onChange={e => { setLang(e.target.value); setCode(starters[e.target.value] || starters.other); }} style={{ width: 130, flexShrink: 0 }}>
          {Object.keys(starters).filter(k => k !== 'other').map(k => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}
        </select>
        <button className="btn btn-primary" onClick={submit} disabled={submitting}>{submitting ? 'Reviewing...' : 'Submit'}</button>
      </div>
      <div className="problem-grid">
        <div className="problem-left">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>{problem.title}</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{problem.description}</p>
          <div className="problem-meta">
            {problem.input_description && <><h3>Input</h3><p>{problem.input_description}</p></>}
            {problem.output_description && <><h3>Output</h3><p>{problem.output_description}</p></>}
            {problem.constraints && <><h3>Constraints</h3><p>{problem.constraints}</p></>}
            {ex && (ex.input || ex.output) && (
              <div style={{ marginTop: 16 }}>
                <h3>Example</h3>
                <div className="example-grid">
                  {ex.input && (
                    <div className="example-box">
                      <div className="example-title">Input</div>
                      <pre className="example-content">{ex.input}</pre>
                    </div>
                  )}
                  {ex.output && (
                    <div className="example-box">
                      <div className="example-title">Output</div>
                      <pre className="example-content">{ex.output}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="problem-right">
          <div className="editor-wrapper">
            <CodeMirror value={code} height="100%" extensions={exts[lang] || exts.javascript} onChange={v => setCode(v)} theme={themeMode === 'dark' ? 'dark' : 'light'} />
          </div>

          {/* Submitting Loading State with Hamster Animation */}
          {submitting && (
            <div className="review-panel">
              <div className="review-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                AI Reviewing Code...
              </div>
              <HamsterLoader text="AI is evaluating syntax, logic, time & space complexity..." />
            </div>
          )}

          {/* Review Results */}
          {!submitting && review && (
            <div className="review-panel">
              <div className="review-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                AI Code Review
              </div>
              <div className="review-body">
                {review.has_syntax_error && (
                  <div className="syntax-error-banner">
                    <div className="syntax-error-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Syntax Error — Line {review.syntax_error_line}</div>
                      <div style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.9 }}>{review.syntax_error_message}</div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className={`score-circle ${scClass}`}>{sc}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>AI Score</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {review.has_syntax_error ? 'Fix syntax errors first' : sc >= 80 ? 'Excellent' : sc >= 60 ? 'Good' : 'Keep trying'}
                    </div>
                  </div>
                </div>
                <div className="review-grid">
                  {[['Logical', (review.logical_correctness ?? 0) + '%'], ['Time', review.time_complexity || 'N/A'], ['Space', review.space_complexity || 'N/A'], ['Syntax', review.syntax_review || 'N/A']].map(([l, v]) => (
                    <div className="review-item" key={l}>
                      <div className="review-label">{l}</div>
                      <div className="review-value">{v}</div>
                    </div>
                  ))}
                </div>
                {review.mistakes && <div className="review-item" style={{ marginTop: 10 }}><div className="review-label">Mistakes</div><div className="review-value">{review.mistakes}</div></div>}
                {review.suggestions && <div className="review-item" style={{ marginTop: 10 }}><div className="review-label">Suggestions</div><div className="review-value">{review.suggestions}</div></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
