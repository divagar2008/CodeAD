const prisma = require('../../../config/database');

const TIERS = [
  { name: 'Bronze', min: 0, icon: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.15)' },
  { name: 'Silver', min: 100, icon: '🥈', color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)' },
  { name: 'Gold', min: 300, icon: '🥇', color: '#ffd700', bg: 'rgba(255,215,0,0.15)' },
  { name: 'Platinum', min: 600, icon: '💎', color: '#e5e4e2', bg: 'rgba(229,228,226,0.15)' },
  { name: 'Diamond', min: 1000, icon: '👑', color: '#b9f2ff', bg: 'rgba(185,242,255,0.15)' },
];

function getTier(points) {
  let current = TIERS[0];
  let next = TIERS[1] || null;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100))
    : 100;
  return { current, next, progress, allTiers: TIERS };
}

async function getStreak(studentId) {
  const subs = await prisma.submissions.findMany({
    where: { student_id: studentId },
    select: { created_at: true },
    orderBy: { created_at: 'desc' },
  });
  if (subs.length === 0) return { current: 0, best: 0 };

  const days = [...new Set(subs.map(s => s.created_at.toISOString().split('T')[0]))];
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (days.includes(ds)) streak++;
    else if (i > 0) break;
  }

  let best = 0, cur = 0;
  for (let i = 0; i < days.length; i++) {
    if (i === 0) { cur = 1; } else {
      const prev = new Date(days[i - 1]), curr = new Date(days[i]);
      if ((curr - prev) / 86400000 === 1) cur++;
      else { best = Math.max(best, cur); cur = 1; }
    }
  }
  best = Math.max(best, cur);

  return { current: streak, best };
}

async function getHeatmap(studentId) {
  const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const subs = await prisma.submissions.findMany({
    where: { student_id: studentId, created_at: { gte: oneYearAgo } },
    select: { created_at: true },
  });
  const dayMap = {};
  subs.forEach(s => { const day = s.created_at.toISOString().split('T')[0]; dayMap[day] = (dayMap[day] || 0) + 1; });
  const data = [], today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    data.push({ date: d.toISOString().split('T')[0], count: dayMap[d.toISOString().split('T')[0]] || 0 });
  }
  return data;
}

async function getScoreHistory(studentId) {
  const subs = await prisma.submissions.findMany({
    where: { student_id: studentId },
    select: { ai_score: true, created_at: true, language: true },
    orderBy: { created_at: 'asc' },
  });
  let cumulative = 0;
  return subs.map(s => {
    cumulative += s.ai_score || 0;
    return { date: s.created_at.toISOString().split('T')[0], score: s.ai_score || 0, cumulative, language: s.language };
  });
}

async function getTopStudents(excludeId, limit = 10) {
  const entries = await prisma.leaderboard.findMany({
    include: { student: { select: { id: true, name: true, department: true } } },
    orderBy: { total_score: 'desc' }, take: limit + 5,
  });
  return entries.filter(e => e.student_id !== excludeId).slice(0, limit).map((e, i) => ({
    rank: i + 1, studentId: e.student_id, name: e.student.name,
    department: e.student.department, totalScore: e.total_score,
  }));
}

async function getMentorStatus(studentId) {
  const entries = await prisma.leaderboard.findMany({ orderBy: { total_score: 'desc' }, take: 5 });
  const rank = entries.findIndex(e => e.student_id === studentId);
  return { isMentor: rank !== -1, mentorRank: rank !== -1 ? rank + 1 : null, mentorTier: rank === 0 ? 'The Champion' : rank === 1 ? 'The Conqueror' : rank === 2 ? 'The Victor' : 'Mentor' };
}

module.exports = { getTier, getStreak, getHeatmap, getScoreHistory, getTopStudents, getMentorStatus, TIERS };
