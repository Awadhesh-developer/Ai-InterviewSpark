import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { config } from '../config';
import { performanceConfig } from '../config/performance';

let Pool: any = null;
try {
  const pg = require('pg');
  Pool = pg.Pool;
} catch (error) {
  console.warn('⚠️  pg not installed, database optimization will be disabled');
}

export interface QueryMetrics {
  query: string;
  duration: number;
  rows: number;
  timestamp: number;
  cached: boolean;
  error?: string;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
  maxConnections: number;
  connectionErrors: number;
  slowQueries: number;
  errorRate: number;
  responseTime: number;
}

export class DatabaseOptimizationService {
  private pool: any = null;
  private db: any = null;
  private queryMetrics: QueryMetrics[] = [];
  private connectionErrors = 0;
  private isMonitoring = false;

  constructor() {
    if (Pool) {
      this.initializePool();
      this.startMonitoring();
    }
  }

  private initializePool(): void {
    const poolConfig = {
      connectionString: config.database.url,
      max: performanceConfig.database.pool.max,
      min: performanceConfig.database.pool.min,
      idleTimeoutMillis: performanceConfig.database.pool.idleTimeoutMillis,
      connectionTimeoutMillis: performanceConfig.database.pool.connectionTimeoutMillis,
      acquireTimeoutMillis: performanceConfig.database.pool.acquireTimeoutMillis,
      
      statement_timeout: 30000,
      query_timeout: 30000,
      application_name: 'InterviewSpark-API',
      
      ssl: config.database.ssl ? {
        rejectUnauthorized: false
      } : false
    };

    this.pool = new Pool(poolConfig);
    this.db = drizzle(this.pool);

    this.pool.on('error', (err: Error) => {
      console.error('Database pool error:', err);
      this.connectionErrors++;
    });

    this.pool.on('connect', () => {
      console.log('🔗 New database connection established');
    });
  }

  async executeOptimizedQuery<T>(
    query: string,
    params: any[] = [],
    useCache: boolean = true
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      const result = await client.query(query, params);
      const duration = Date.now() - startTime;

      this.recordQueryMetrics({
        query: query.substring(0, 100),
        duration,
        rows: result.rowCount || 0,
        timestamp: Date.now(),
        cached: false
      });

      if (duration > performanceConfig.database.optimization.slowQueryThreshold) {
        console.warn(`🐌 Slow query detected (${duration}ms):`, query.substring(0, 100));
        await this.analyzeSlowQuery(query);
      }

      return result.rows;
    } catch (error) {
      this.recordQueryMetrics({
        query: query.substring(0, 100),
        duration: Date.now() - startTime,
        rows: 0,
        timestamp: Date.now(),
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    if (this.queryMetrics.length > performanceConfig.database.optimization.maxMetricsHistory) {
      this.queryMetrics.shift();
    }
  }

  private async analyzeSlowQuery(query: string): Promise<void> {
    if (!performanceConfig.database.optimization.enableQueryAnalysis) {
      return;
    }

    try {
      const client = await this.pool.connect();
      const explainResult = await client.query(`EXPLAIN ANALYZE ${query}`);
      
      console.log('📊 Query Analysis:', explainResult.rows);
      
      if (performanceConfig.database.optimization.autoIndexCreation) {
        await this.suggestIndexes(query);
      }
      
      client.release();
    } catch (error) {
      console.error('Query analysis failed:', error);
    }
  }

  private async suggestIndexes(query: string): Promise<void> {
    // Simple index suggestion logic
    const whereMatch = query.match(/WHERE\s+(\w+)\s*=/i);
    if (whereMatch) {
      const column = whereMatch[1];
      console.log(`💡 Consider creating index on column: ${column}`);
    }
  }

  async getConnectionStats(): Promise<ConnectionPoolStats> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      maxConnections: performanceConfig.database.pool.max,
      connectionErrors: this.connectionErrors,
      slowQueries: this.queryMetrics.filter(q => q.duration > 1000).length,
      errorRate: this.connectionErrors / Math.max(this.pool.totalCount, 1),
      responseTime: this.calculateAverageResponseTime()
    };
  }

  getQueryMetrics(): QueryMetrics[] {
    return [...this.queryMetrics];
  }

  private startMonitoring(): void {
    if (this.isMonitoring || !performanceConfig.database.monitoring.enabled) {
      return;
    }

    this.isMonitoring = true;
    
    setInterval(async () => {
      try {
        const stats = await this.getConnectionStats();
        const avgResponseTime = this.calculateAverageResponseTime();
        
        if (avgResponseTime > performanceConfig.database.monitoring.alertThresholds.responseTime.warning) {
          console.warn(`⚠️  High database response time: ${avgResponseTime}ms`);
        }
        
        if (stats.totalConnections > performanceConfig.database.monitoring.alertThresholds.connectionCount.warning) {
          console.warn(`⚠️  High connection count: ${stats.totalConnections}`);
        }
        
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, performanceConfig.database.monitoring.intervalMs);
  }

  private calculateAverageResponseTime(): number {
    if (this.queryMetrics.length === 0) return 0;
    
    const recentMetrics = this.queryMetrics.slice(-10);
    const totalTime = recentMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalTime / recentMetrics.length;
  }

  async cleanup(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ Database optimization service cleaned up');
    }
  }
}

export const databaseOptimizationService = new DatabaseOptimizationService();

