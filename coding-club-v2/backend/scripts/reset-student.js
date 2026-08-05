require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetStudent(email) {
  const student = await prisma.students.findUnique({ where: { email } });
  if (!student) { console.log('Student not found'); return; }

  await prisma.students.update({
    where: { id: student.id },
    data: { coding_score: 0, total_points: 0, problems_solved: 0 },
  });
  await prisma.leaderboard.upsert({
    where: { student_id: student.id },
    update: { coding_score: 0, live_session_pts: 0, total_score: 0 },
    create: { student_id: student.id, coding_score: 0, live_session_pts: 0, total_score: 0 },
  });
  await prisma.submissions.deleteMany({ where: { student_id: student.id } });
  console.log(`Reset ${student.name} (${email}) — all points and submissions cleared.`);
}

resetStudent(process.argv[2] || 'athief@college.edu').catch(console.error).finally(() => prisma.$disconnect());
