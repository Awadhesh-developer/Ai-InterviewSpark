import express from 'express';
import { initializeDatabase, closeDatabaseConnection } from './database/connection';
import { runMigrations, validateSchema, createIndexes } from './database/migrations/migrate';
import { databaseOptimizationService } from './services/databaseOptimizationService';
import { config } from './config';

const app = express();

// Database initialization middleware
app.use(async (req, res, next) => {
  if (!req.app.locals.dbInitialized) {
    try {
      await initializeDatabase();
      
      if (config.server.isProduction) {
        await runMigrations();
        await validateSchema();
        await createIndexes();
      }
      
      req.app.locals.dbInitialized = true;
      console.log('✅ Database fully initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return res.status(503).json({ error: 'Database unavailable' });
    }
  }
  next();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  
  try {
    await databaseOptimizationService.cleanup();
    await closeDatabaseConnection();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  
  try {
    await databaseOptimizationService.cleanup();
    await closeDatabaseConnection();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

export default app;