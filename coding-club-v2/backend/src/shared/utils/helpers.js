const prisma = require('../../config/database');

async function logActivity(userId, userType, action, details = null) {
  try {
    await prisma.activity_logs.create({
      data: { user_id: userId, user_type: userType, action, details: details || undefined },
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
}

const DIFFICULTY_BASE = { easy: 100, medium: 200, hard: 300 };

function getTimeBonus(secs) {
  if (secs == null || secs < 0) return 1.0;
  if (secs < 300) return 1.5;
  if (secs < 900) return 1.3;
  if (secs < 1800) return 1.1;
  if (secs < 3600) return 1.0;
  return 0.9;
}

function calculatePoints(difficulty, aiScore, timeTakenSecs) {
  const base = DIFFICULTY_BASE[difficulty] || 100;
  const quality = Math.min(100, Math.max(0, aiScore)) / 100;
  const bonus = getTimeBonus(timeTakenSecs);
  return Math.round(base * quality * bonus);
}

module.exports = { logActivity, calculatePoints, getTimeBonus, DIFFICULTY_BASE };
