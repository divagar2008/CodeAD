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
  const [compiling, setCompiling] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [compileResult, setCompileResult] = useState(null);
  const [review, setReview] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(null);

  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'errors' | 'review'

  const [themeMode, setThemeMode] = useState(
    document.documentElement.getAttribute('data-theme') || 'dark'
  );

  // Disable copy, paste, cut, and right click context menu across the page
  useEffect(() => {
    const preventCopyPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error('Copying and pasting is disabled in the code editor to ensure authentic practice!', { id: 'no-copy-paste' });
      return false;
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'C', 'V', 'X'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Keyboard copy/paste shortcuts are disabled!', { id: 'no-copy-paste-shortcut' });
        return false;
      }
    };

    document.addEventListener('copy', preventCopyPaste, true);
    document.addEventListener('paste', preventCopyPaste, true);
    document.addEventListener('cut', preventCopyPaste, true);
    document.addEventListener('contextmenu', preventCopyPaste, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('copy', preventCopyPaste, true);
      document.removeEventListener('paste', preventCopyPaste, true);
      document.removeEventListener('cut', preventCopyPaste, true);
      document.removeEventListener('contextmenu', preventCopyPaste, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

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
        const data = r.data.data;
        setProblem(data);
        setHasSubmitted(data.hasSubmitted || false);
        setExistingSubmission(data.existingSubmission || null);

        if (data.existingSubmission) {
          setCode(data.existingSubmission.code || data.starter_code || starters.javascript);
          if (data.existingSubmission.language) setLang(data.existingSubmission.language);
          if (data.existingSubmission.ai_feedback) {
            setReview(data.existingSubmission.ai_feedback);
            setActiveTab('review');
          }
          if (data.existingSubmission.points_earned != null) {
            setPointsEarned(data.existingSubmission.points_earned);
          }
        } else {
          setCode(data.starter_code || starters.javascript);
          if (!localStorage.getItem(`problem_started_${id}`)) {
            localStorage.setItem(`problem_started_${id}`, new Date().toISOString());
          }
        }
      })
      .catch(() => toast.error('Failed to load problem'))
      .finally(() => setLoading(false));
  }, [id]);

  const compile = async () => {
    if (!code.trim()) return toast.error('Write some code before compiling');
    setCompiling(true);
    try {
      const r = await api.post('/student/compile', { problem_id: Number(id), code, language: lang });
      const res = r.data.data;
      setCompileResult(res);
      if (res.has_syntax_error) {
        toast.error(`Compilation error on Line ${res.syntax_error_line || 1}`);
        setActiveTab('errors');
      } else {
        toast.success('Compiled successfully! Check output logs.');
        setActiveTab('console');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Compilation failed');
    } finally {
      setCompiling(false);
    }
  };

  const submit = async () => {
    if (hasSubmitted) return toast.error('You have already submitted a solution for this problem.');
    if (!code.trim()) return toast.error('Write some code before submitting');
    if (compileResult?.has_syntax_error) {
      return toast.error('Please fix all syntax errors before submitting your solution!');
    }

    setSubmitting(true);
    try {
      const startedAt = localStorage.getItem(`problem_started_${id}`) || new Date().toISOString();
      const r = await api.post('/student/submit', { problem_id: Number(id), code, language: lang, started_at: startedAt });
      const submittedReview = r.data.data.review;
      const earned = r.data.data.pointsEarned;
      setReview(submittedReview);
      setPointsEarned(earned);
      setHasSubmitted(true);
      setExistingSubmission(r.data.data.submission);
      setActiveTab('review');
      localStorage.removeItem(`problem_started_${id}`);

      if (submittedReview?.has_syntax_error) {
        toast.error('Syntax error detected! Check review panel.');
      } else {
        toast.success(`+${earned} points earned!`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!problem) return <div className="empty"><p>Problem not found</p><button className="btn btn-outline" onClick={() => nav('/problems')}>Back to Problems</button></div>;

  const sc = review?.ai_score ?? existingSubmission?.ai_score ?? 0;
  const scClass = sc >= 80 ? 'score-high' : sc >= 60 ? 'score-mid' : sc >= 40 ? 'score-low' : 'score-bad';
  const displayPoints = pointsEarned ?? existingSubmission?.points_earned ?? null;

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
        <span className={`badge badge-${problem.difficulty}`}>{problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}</span>
        <select
          className="select"
          value={lang}
          onChange={e => {
            if (hasSubmitted) return;
            setLang(e.target.value);
            setCode(starters[e.target.value] || starters.other);
          }}
          disabled={hasSubmitted}
          style={{ width: 130, flexShrink: 0 }}
        >
          {Object.keys(starters).filter(k => k !== 'other').map(k => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}
        </select>
        
        {/* Compile / Run Button */}
        <button className="btn btn-warning" onClick={compile} disabled={compiling || submitting || hasSubmitted}>
          {compiling ? 'Compiling...' : '▶ Run / Compile'}
        </button>

        {/* Submit Button */}
        {hasSubmitted ? (
          <button className="btn btn-secondary" disabled title="You have already submitted this problem once">
            ✓ Submitted {displayPoints != null ? `(+${displayPoints} pts)` : `(${sc}/100)`}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={submit} disabled={submitting || compiling}>
            {submitting ? 'Submitting...' : 'Submit Solution'}
          </button>
        )}
      </div>

      <div className="problem-grid">
        <div className="problem-left">
          {hasSubmitted && (
            <div className="submitted-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Problem Completed! You have submitted your final answer.</span>
            </div>
          )}

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
            <CodeMirror
              value={code}
              height="100%"
              extensions={exts[lang] || exts.javascript}
              onChange={v => {
                if (hasSubmitted) return;
                setCode(v);
              }}
              readOnly={hasSubmitted}
              theme={themeMode === 'dark' ? 'dark' : 'light'}
            />
          </div>

          {/* Loader Animations */}
          {compiling && (
            <div className="review-panel">
              <div className="review-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Compiling & Checking Code...
              </div>
              <HamsterLoader text="Compiling code, verifying syntax & executing stdout test cases..." />
            </div>
          )}

          {submitting && (
            <div className="review-panel">
              <div className="review-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Submitting & Calculating Score...
              </div>
              <HamsterLoader text="AI is evaluating final score, updating database & leaderboard..." />
            </div>
          )}

          {/* Console / Terminal & Review Tabbed Output */}
          {!compiling && !submitting && (compileResult || review || existingSubmission) && (
            <div className="console-container">
              <div className="console-tabs">
                <button
                  className={`console-tab ${activeTab === 'console' ? 'active' : ''}`}
                  onClick={() => setActiveTab('console')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                  Output Console
                </button>
                <button
                  className={`console-tab ${activeTab === 'errors' ? 'active error-tab' : ''}`}
                  onClick={() => setActiveTab('errors')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Error Logs {compileResult?.has_syntax_error ? '(1 Error)' : ''}
                </button>
                {(review || existingSubmission) && (
                  <button
                    className={`console-tab ${activeTab === 'review' ? 'active' : ''}`}
                    onClick={() => setActiveTab('review')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    AI Review & Score ({sc}/100)
                  </button>
                )}
              </div>

              <div className="console-body">
                {activeTab === 'console' && (
                  <div>
                    {compileResult ? (
                      <div>
                        {compileResult.program_output && (
                          <div style={{ marginBottom: 14 }}>
                            <div className="console-output-label">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                              Exact Code Output (stdout / return value):
                            </div>
                            <pre className="log-pre log-pre-output">
                              {compileResult.program_output}
                            </pre>
                          </div>
                        )}
                        <div className="console-output-label">Compilation & Execution Summary:</div>
                        <pre className="log-pre">{compileResult.output_log}</pre>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Click "Run / Compile" to view exact program stdout output and execution logs.</p>
                    )}
                  </div>
                )}

                {activeTab === 'errors' && (
                  <div>
                    {compileResult?.has_syntax_error ? (
                      <div>
                        <div className="syntax-error-banner">
                          <div className="syntax-error-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Syntax Error — Line {compileResult.syntax_error_line || 1}</div>
                            <div style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.9 }}>{compileResult.syntax_error_message}</div>
                          </div>
                        </div>
                        <pre className="error-pre">{compileResult.error_log}</pre>
                      </div>
                    ) : compileResult ? (
                      <pre className="log-pre log-pre-success">✓ Clean build: No syntax or compilation errors found!</pre>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Click "Run / Compile" to check your code for syntax errors.</p>
                    )}
                  </div>
                )}

                {activeTab === 'review' && (review || existingSubmission) && (
                  <div className="review-body" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div className={`score-circle ${scClass}`}>{sc}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {displayPoints != null ? `+${displayPoints} Points Earned` : 'Final Score'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {sc >= 80 ? 'Excellent Solution' : sc >= 60 ? 'Good Effort' : 'Needs Improvement'}
                          {displayPoints != null && ` • AI Score: ${sc}/100`}
                        </div>
                      </div>
                    </div>
                    <div className="review-grid">
                      {[
                        ['Logical Score', (review?.logical_correctness ?? existingSubmission?.logical_correctness ?? 0) + '%'],
                        ['Time Complexity', review?.time_complexity || existingSubmission?.time_complexity || 'N/A'],
                        ['Space Complexity', review?.space_complexity || existingSubmission?.space_complexity || 'N/A'],
                        ['Syntax Review', review?.syntax_review || existingSubmission?.syntax_review || 'N/A']
                      ].map(([l, v]) => (
                        <div className="review-item" key={l}>
                          <div className="review-label">{l}</div>
                          <div className="review-value">{v}</div>
                        </div>
                      ))}
                    </div>
                    {(review?.line_analysis || existingSubmission?.ai_feedback?.line_analysis) && (
                      <div className="review-item" style={{ marginTop: 10 }}>
                        <div className="review-label">Line-by-Line Analysis</div>
                        <div className="review-value">{review?.line_analysis || existingSubmission?.ai_feedback?.line_analysis}</div>
                      </div>
                    )}
                    {(review?.mistakes || existingSubmission?.mistakes) && (
                      <div className="review-item" style={{ marginTop: 10 }}>
                        <div className="review-label">Mistakes</div>
                        <div className="review-value">{review?.mistakes || existingSubmission?.mistakes}</div>
                      </div>
                    )}
                    {(review?.suggestions || existingSubmission?.suggestions) && (
                      <div className="review-item" style={{ marginTop: 10 }}>
                        <div className="review-label">Suggestions</div>
                        <div className="review-value">{review?.suggestions || existingSubmission?.suggestions}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
