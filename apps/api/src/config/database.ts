import { z } from 'zod';

const databaseConfigSchema = z.object({
  url: z.string().url(),
  ssl: z.boolean().default(false),
  maxConnections: z.number().min(1).max(100).default(20),
  minConnections: z.number().min(1).max(50).default(5),
  connectionTimeout: z.number().min(1000).max(60000).default(10000),
  idleTimeout: z.number().min(1000).max(300000).default(30000),
  statementTimeout: z.number().min(1000).max(300000).default(30000),
});

export const databaseConfig = databaseConfigSchema.parse({
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true',
  maxConnections: parseInt(process.env.DB_POOL_MAX || '20'),
  minConnections: parseInt(process.env.DB_POOL_MIN || '5'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
});

export const getProductionDatabaseConfig = () => ({
  ...databaseConfig,
  ssl: true,
  maxConnections: 50,
  minConnections: 10,
  connectionTimeout: 5000,
  idleTimeout: 60000,
  statementTimeout: 60000,
});

export const getDevelopmentDatabaseConfig = () => ({
  ...databaseConfig,
  ssl: false,
  maxConnections: 10,
  minConnections: 2,
  connectionTimeout: 10000,
  idleTimeout: 30000,
  statementTimeout: 30000,
});