const config = require('../../config');

async function sendEmail(to, subject, htmlContent) {
  if (!config.brevo.apiKey || config.brevo.apiKey === 'your_brevo_api_key_here') {
    console.warn('[Email] BREVO_API_KEY not set. Skipping email to', to.email);
    return null;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': config.brevo.apiKey,
      },
      body: JSON.stringify({
        sender: { email: config.brevo.senderEmail, name: config.brevo.senderName },
        to: [{ email: to.email, name: to.name || '' }],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[Email] Sent to ${to.email}: ${subject} (messageId: ${data.messageId})`);
      return data;
    } else {
      console.error(`[Email] Brevo API error: ${response.status}`, JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.error(`[Email] Failed to send to ${to.email}:`, err.message);
    return null;
  }
}

async function sendWelcomeEmail(name, email) {
  const subject = 'Welcome to CodeAD!';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; padding: 40px; border: 1px solid #2a2a4a;">
        <h1 style="color: #f59e0b; font-size: 28px; margin: 0 0 8px 0;">Welcome to CodeAD!</h1>
        <p style="color: #888; font-size: 13px; margin: 0 0 24px 0;">Your coding journey starts here</p>
        <p style="font-size: 16px; line-height: 1.6;">Hi <strong style="color: #fff;">${name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.7; color: #bbb;">We're thrilled to have you on board! CodeAD is your platform to sharpen your coding skills, compete on the leaderboard, and grow as a developer.</p>
        <div style="background: #16213e; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #2a2a4a;">
          <p style="font-size: 14px; margin: 0 0 12px 0; color: #f59e0b; font-weight: bold;">Here's what you can do:</p>
          <p style="font-size: 14px; margin: 6px 0; color: #ccc;">Solve coding problems across Easy, Medium & Hard levels</p>
          <p style="font-size: 14px; margin: 6px 0; color: #ccc;">Get instant AI-powered code reviews</p>
          <p style="font-size: 14px; margin: 6px 0; color: #ccc;">Climb the leaderboard & earn achievements</p>
          <p style="font-size: 14px; margin: 6px 0; color: #ccc;">Track your progress over time</p>
        </div>
        <a href="${config.frontendUrl}/problems" style="display: inline-block; background: #f59e0b; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 16px 0;">Start Solving Problems</a>
        <p style="font-size: 13px; color: #666; margin-top: 32px; border-top: 1px solid #2a2a4a; padding-top: 16px;">Happy Coding!<br><strong style="color: #f59e0b;">Team CodeAD</strong></p>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ name, email }, subject, htmlContent);
}

async function sendNewProblemNotification(studentName, studentEmail, problem) {
  const difficultyColor = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
  const color = difficultyColor[problem.difficulty] || '#f59e0b';
  const subject = 'New Problem: ' + problem.title;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; padding: 40px; border: 1px solid #2a2a4a;">
        <h1 style="color: #f59e0b; font-size: 24px; margin: 0 0 8px 0;">New Problem Available!</h1>
        <p style="color: #888; font-size: 13px; margin: 0 0 24px 0;">Time to sharpen your skills</p>
        <p style="font-size: 15px; line-height: 1.7; color: #bbb;">Hi <strong style="color: #fff;">${studentName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.7; color: #bbb;">A new coding problem has been uploaded to CodeAD. Give it a try!</p>
        <div style="background: #16213e; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #2a2a4a;">
          <p style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0; color: #fff;">${problem.title}</p>
          <p style="margin: 0 0 12px 0;"><span style="background: ${color}; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">${problem.difficulty}</span></p>
          <p style="font-size: 14px; color: #bbb; line-height: 1.6; margin: 0;">${problem.description}</p>
        </div>
        <a href="${config.frontendUrl}/problems/${problem.id}" style="display: inline-block; background: #f59e0b; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 16px 0;">Solve Now</a>
        <p style="font-size: 13px; color: #666; margin-top: 32px; border-top: 1px solid #2a2a4a; padding-top: 16px;">Happy Coding!<br><strong style="color: #f59e0b;">Team CodeAD</strong></p>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ name: studentName, email: studentEmail }, subject, htmlContent);
}

module.exports = { sendWelcomeEmail, sendNewProblemNotification, sendEmail };
