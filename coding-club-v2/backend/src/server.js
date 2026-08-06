require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./modules/auth/routes');
const studentRoutes = require('./modules/students/routes');
const adminRoutes = require('./modules/admin/routes');
const problemRoutes = require('./modules/problems/routes');
const sessionRoutes = require('./modules/sessions/routes');
const achievementRoutes = require('./modules/students/routes/achievementRoutes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:3000',
      'https://code-ad-iota.vercel.app',
      'https://codead.vercel.app',
    ];
    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(null, origin);
    }
  },
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '10mb' }));
if (config.nodeEnv === 'development') app.use(morgan('dev'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', env: config.nodeEnv, version: '2.1.0' }));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/problems', problemRoutes);
app.use('/api/admin/sessions', sessionRoutes);
app.use('/api/student/achievements', achievementRoutes);

app.use((_, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use(errorHandler);

app.listen(config.port, () => console.log(`Server running on port ${config.port}`));