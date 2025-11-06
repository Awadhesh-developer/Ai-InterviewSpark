// --- START api/src/index.ts --- //
// Main entry point for AI-InterviewSpark API server
// Sets up Express server with middleware, routes, and WebSocket support

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { sql } from 'drizzle-orm';
import { config } from './config';
import { initializeDatabase, closeDatabaseConnection } from './database/connection';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import userRoutes from './routes/users';
import interviewRoutes from './routes/interviews';
import enhancedInterviewRoutes from './routes/enhancedInterviews';
import productionInterviewRoutes from './routes/productionInterview';
import aiRoutes from './routes/ai';
import resumeRoutes from './routes/resumes';
import expertRoutes from './routes/experts';
import analyticsRoutes from './routes/analytics';
import uploadRoutes from './routes/upload';
import notificationRoutes from './routes/notifications';

// Create Express app
const app = express();
const server = createServer(app);

// Initialize WebSocket service for real-time features
import WebSocketService from './services/websocketService';
let websocketService: WebSocketService;

// Security middleware - Enhanced security headers
import { securityHeaders } from './middleware/security';
app.use(helmet(securityHeaders));

// CORS configuration
app.use(cors({
  origin: config.securityConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.securityConfig.rateLimit.windowMs,
  max: config.securityConfig.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI-InterviewSpark API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Database health check endpoint
app.get('/health/database', async (req, res) => {
  try {
    const { checkDatabaseHealth, db } = await import('./database/connection');
    const health = await checkDatabaseHealth();

    // Additional table checks
    let tableChecks = {};
    if (health.healthy) {
      try {
        // Check if main tables exist and get row counts
        const { users, interviewSessions, questions } = await import('./database/schema');

        const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
        const [sessionCount] = await db.select({ count: sql`count(*)` }).from(interviewSessions);
        const [questionCount] = await db.select({ count: sql`count(*)` }).from(questions);

        tableChecks = {
          users: { exists: true, count: Number(userCount.count) },
          interviewSessions: { exists: true, count: Number(sessionCount.count) },
          questions: { exists: true, count: Number(questionCount.count) }
        };
      } catch (tableError) {
        tableChecks = { error: 'Tables may not exist or need migration', details: tableError instanceof Error ? tableError.message : 'Unknown error' };
      }
    }

    res.json({
      success: health.healthy,
      message: health.healthy ? 'Database connection is healthy' : 'Database connection failed',
      timestamp: new Date().toISOString(),
      latency: health.latency,
      details: health.details,
      tables: tableChecks
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database users test endpoint
app.get('/health/database/users', async (req, res) => {
  try {
    const { db } = await import('./database/connection');
    const { users } = await import('./database/schema');

    const userList = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt
    }).from(users).limit(5);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString(),
      count: userList.length,
      users: userList
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Failed to retrieve users',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/interviews', authenticate, interviewRoutes);
app.use('/api/enhanced-interviews', authenticate, enhancedInterviewRoutes);
app.use('/api/production-interviews', authenticate, productionInterviewRoutes);
app.use('/api/ai', authenticate, aiRoutes);
app.use('/api/resumes', authenticate, resumeRoutes);
if (config.features.expertSessions) {
  app.use('/api/experts', authenticate, expertRoutes);
}
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/upload', authenticate, uploadRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);

// WebSocket service will be initialized in startServer function

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await closeDatabaseConnection();
    
    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    try {
      await initializeDatabase();
    } catch (error) {
      console.warn('⚠️  Database connection failed, starting server without database...');
      console.warn('   This is expected in development without a PostgreSQL instance');
    }
    
    // Initialize WebSocket service
    websocketService = new WebSocketService(server);

    // Start HTTP server
    server.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 AI-InterviewSpark API server running on http://${config.server.host}:${config.server.port}`);
      logger.info(`📊 Environment: ${config.server.nodeEnv}`);
      logger.info(`🔐 Authentication: ${config.auth.clerk.secretKey ? 'Clerk' : 'JWT'}`);
      logger.info(`🤖 AI Services: OpenAI=${config.ai.openai.enabled}, Gemini=${config.ai.gemini.enabled}`);
      logger.info(`🎭 Emotional Analysis: Motivel=${config.ai.motivel.enabled}, Moodme=${config.ai.moodme.enabled}`);
      logger.info(`🔌 WebSocket: Real-time features enabled`);
      logger.info(`📁 Storage: AWS S3=${config.storage.aws.enabled}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Export for testing
export { app, server };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
} 