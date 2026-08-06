require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  nemotron: {
    apiKey: process.env.NEMOTRON_API_KEY,
    apiUrl: process.env.NEMOTRON_API_URL,
    model: process.env.NEMOTRON_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@codead.app',
    senderName: process.env.BREVO_SENDER_NAME || 'CodeAD',
  },
};
