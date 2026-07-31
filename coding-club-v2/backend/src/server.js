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

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '10mb' }));
if (config.nodeEnv === 'development') app.use(morgan('dev'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', env: config.nodeEnv }));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/problems', problemRoutes);
app.use('/api/admin/sessions', sessionRoutes);

app.use((_, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use(errorHandler);

app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
