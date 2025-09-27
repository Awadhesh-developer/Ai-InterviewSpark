// --- START api/database/connection.ts --- //
// Database connection module for AI-InterviewSpark API
// Establishes and manages PostgreSQL connection using Drizzle ORM

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config';
import { performanceConfig } from '../config/performance';
import * as schema from './schema';

// Enhanced PostgreSQL connection with optimized pooling
const connectionString = config.database.url;

const client = postgres(connectionString, {
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: performanceConfig.database.pool.max,
  idle_timeout: performanceConfig.database.pool.idleTimeoutMillis / 1000,
  connect_timeout: performanceConfig.database.pool.connectionTimeoutMillis / 1000,
  prepare: true,
  transform: {
    undefined: null,
  },
  onnotice: (notice) => {
    if (config.server.isDevelopment) {
      console.log('PostgreSQL Notice:', notice);
    }
  },
  debug: config.server.isDevelopment,
});

export const db = drizzle(client, { 
  schema,
  logger: config.server.isDevelopment
});

// Connection pool monitoring
export const getConnectionStats = async () => {
  try {
    const result = await client`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to get connection stats:', error);
    return null;
  }
};

// Enhanced health check with detailed diagnostics
export const checkDatabaseHealth = async (): Promise<{
  healthy: boolean;
  latency: number;
  details: any;
}> => {
  const startTime = Date.now();
  
  try {
    const [versionResult, statsResult] = await Promise.all([
      client`SELECT version(), current_database(), current_user`,
      getConnectionStats()
    ]);
    
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      latency,
      details: {
        version: versionResult[0].version,
        database: versionResult[0].current_database,
        user: versionResult[0].current_user,
        connections: statsResult
      }
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      healthy: false,
      latency: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
};

// Graceful shutdown with connection cleanup
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    console.log('🔄 Closing database connections...');
    await client.end({ timeout: 5 });
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
    throw error;
  }
};

// Database initialization with retry logic
export const initializeDatabase = async (retries = 3): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Initializing database (attempt ${attempt}/${retries})...`);
      
      const health = await checkDatabaseHealth();
      
      if (health.healthy) {
        console.log('✅ Database connection established successfully');
        console.log(`📊 Latency: ${health.latency}ms`);
        console.log(`📋 Database: ${health.details.database}`);
        return;
      } else {
        throw new Error('Database health check failed');
      }
    } catch (error) {
      console.error(`❌ Database initialization attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
      
      if (attempt === retries) {
        throw new Error(`Failed to initialize database after ${retries} attempts`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

export { client as postgresClient };
export default db; 
