import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './utils/logger.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';

const app = express();

// 1. Security Middlewares
app.use(helmet()); // Set security HTTP headers
const allowedOrigins = [
  config.cors.origin,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true
}));
// app.use(xss()); // Prevent XSS attacks (Incompatible with Express 5)
app.use(hpp()); // Prevent HTTP Parameter Pollution
// app.use(mongoSanitize()); // Prevent NoSQL/Parameter injection (Incompatible with Express 5)

// 2. Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Singular to match frontend
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api', teacherRoutes);

// 5. Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Frontend Logger Endpoint
app.post('/api/log', (req, res) => {
  logger.info('[FRONTEND LOG]: ' + JSON.stringify(req.body));
  res.sendStatus(200);
});

// 6. 404 Handler (Catch-all)
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// 7. Global Error Handler
app.use(errorHandler);

export default app;
