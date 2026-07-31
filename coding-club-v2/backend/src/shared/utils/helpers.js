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

function calculateScore(difficulty, aiScore) {
  const multipliers = { easy: 1, medium: 2, hard: 3 };
  return Math.round(aiScore * (multipliers[difficulty] || 1));
}

module.exports = { logActivity, calculateScore };
