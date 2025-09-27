// --- START api/services/systemConfigService.ts --- //
// System configuration service for AI-InterviewSpark API
// Handles system-wide configuration management

import { db } from '../database/connection';
import { systemConfigurations } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { createError } from '../types';

// Configuration types
export type ConfigType = 'string' | 'number' | 'boolean' | 'object' | 'array';

// System configuration interface
export interface SystemConfig {
  key: string;
  value: any;
  type: ConfigType;
  description?: string;
  isActive: boolean;
}

export class SystemConfigService {
  // Get configuration value
  static async getConfig(key: string): Promise<any> {
    try {
      const config = await db.query.systemConfigurations.findFirst({
        where: and(
          eq(systemConfigurations.configKey, key),
          eq(systemConfigurations.isActive, true)
        ),
      });

      if (!config) {
        return null;
      }

      return config.configValue;
    } catch (error) {
      console.error('Failed to get system configuration:', error);
      throw createError('Failed to get system configuration', 500);
    }
  }

  // Get multiple configuration values
  static async getConfigs(keys: string[]): Promise<Record<string, any>> {
    try {
      const configs = await db.query.systemConfigurations.findMany({
        where: and(
          // Add condition for keys in array
          eq(systemConfigurations.isActive, true)
        ),
      });

      const result: Record<string, any> = {};
      configs.forEach(config => {
        if (keys.includes(config.configKey)) {
          result[config.configKey] = config.configValue;
        }
      });

      return result;
    } catch (error) {
      console.error('Failed to get system configurations:', error);
      throw createError('Failed to get system configurations', 500);
    }
  }

  // Set configuration value
  static async setConfig(
    key: string,
    value: any,
    type: ConfigType,
    description?: string,
    updatedBy?: string
  ): Promise<void> {
    try {
      // Check if config exists
      const existingConfig = await db.query.systemConfigurations.findFirst({
        where: eq(systemConfigurations.configKey, key),
      });

      if (existingConfig) {
        // Update existing config
        await db
          .update(systemConfigurations)
          .set({
            configValue: value,
            configType: type,
            description: description || existingConfig.description,
            updatedBy,
            updatedAt: new Date(),
          })
          .where(eq(systemConfigurations.configKey, key));
      } else {
        // Create new config
        await db.insert(systemConfigurations).values({
          configKey: key,
          configValue: value,
          configType: type,
          description,
          updatedBy,
        });
      }
    } catch (error) {
      console.error('Failed to set system configuration:', error);
      throw createError('Failed to set system configuration', 500);
    }
  }

  // Get all configurations
  static async getAllConfigs(): Promise<SystemConfig[]> {
    try {
      const configs = await db.query.systemConfigurations.findMany({
        where: eq(systemConfigurations.isActive, true),
        orderBy: (systemConfigurations, { asc }) => [asc(systemConfigurations.configKey)],
      });

      return configs.map(config => ({
        key: config.configKey,
        value: config.configValue,
        type: config.configType as ConfigType,
        description: config.description || undefined,
        isActive: config.isActive,
      }));
    } catch (error) {
      console.error('Failed to get all system configurations:', error);
      throw createError('Failed to get all system configurations', 500);
    }
  }

  // Delete configuration
  static async deleteConfig(key: string): Promise<void> {
    try {
      await db
        .update(systemConfigurations)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(systemConfigurations.configKey, key));
    } catch (error) {
      console.error('Failed to delete system configuration:', error);
      throw createError('Failed to delete system configuration', 500);
    }
  }

  // Get configuration by type
  static async getConfigsByType(type: ConfigType): Promise<SystemConfig[]> {
    try {
      const configs = await db.query.systemConfigurations.findMany({
        where: and(
          eq(systemConfigurations.configType, type),
          eq(systemConfigurations.isActive, true)
        ),
        orderBy: (systemConfigurations, { asc }) => [asc(systemConfigurations.configKey)],
      });

      return configs.map(config => ({
        key: config.configKey,
        value: config.configValue,
        type: config.configType as ConfigType,
        description: config.description || undefined,
        isActive: config.isActive,
      }));
    } catch (error) {
      console.error('Failed to get system configurations by type:', error);
      throw createError('Failed to get system configurations by type', 500);
    }
  }

  // Initialize default configurations
  static async initializeDefaultConfigs(): Promise<void> {
    try {
      const defaultConfigs = [
        {
          key: 'app_version',
          value: '1.0.0',
          type: 'string' as ConfigType,
          description: 'Current application version',
        },
        {
          key: 'maintenance_mode',
          value: false,
          type: 'boolean' as ConfigType,
          description: 'Maintenance mode status',
        },
        {
          key: 'max_file_size_mb',
          value: 100,
          type: 'number' as ConfigType,
          description: 'Maximum file upload size in MB',
        },
        {
          key: 'session_timeout_minutes',
          value: 30,
          type: 'number' as ConfigType,
          description: 'Session timeout in minutes',
        },
        {
          key: 'notification_retry_attempts',
          value: 3,
          type: 'number' as ConfigType,
          description: 'Number of notification retry attempts',
        },
        {
          key: 'cache_ttl_seconds',
          value: 3600,
          type: 'number' as ConfigType,
          description: 'Default cache TTL in seconds',
        },
        {
          key: 'rate_limit_requests_per_minute',
          value: 100,
          type: 'number' as ConfigType,
          description: 'Rate limit for API requests',
        },
        {
          key: 'ai_provider_default',
          value: 'openai',
          type: 'string' as ConfigType,
          description: 'Default AI provider',
        },
        {
          key: 'email_templates_version',
          value: '1.0',
          type: 'string' as ConfigType,
          description: 'Email templates version',
        },
        {
          key: 'feature_flags',
          value: {
            new_ui: false,
            beta_features: false,
            advanced_analytics: true,
          },
          type: 'object' as ConfigType,
          description: 'Feature flags configuration',
        },
      ];

      for (const config of defaultConfigs) {
        await this.setConfig(
          config.key,
          config.value,
          config.type,
          config.description,
          'system'
        );
      }
    } catch (error) {
      console.error('Failed to initialize default configurations:', error);
      throw createError('Failed to initialize default configurations', 500);
    }
  }

  // Get feature flags
  static async getFeatureFlags(): Promise<Record<string, boolean>> {
    try {
      const featureFlags = await this.getConfig('feature_flags');
      return featureFlags || {};
    } catch (error) {
      console.error('Failed to get feature flags:', error);
      return {};
    }
  }

  // Check if feature is enabled
  static async isFeatureEnabled(feature: string): Promise<boolean> {
    try {
      const featureFlags = await this.getFeatureFlags();
      return featureFlags[feature] || false;
    } catch (error) {
      console.error('Failed to check feature flag:', error);
      return false;
    }
  }

  // Update feature flag
  static async updateFeatureFlag(
    feature: string,
    enabled: boolean,
    updatedBy?: string
  ): Promise<void> {
    try {
      const currentFlags = await this.getFeatureFlags();
      const updatedFlags = {
        ...currentFlags,
        [feature]: enabled,
      };

      await this.setConfig(
        'feature_flags',
        updatedFlags,
        'object',
        'Feature flags configuration',
        updatedBy
      );
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      throw createError('Failed to update feature flag', 500);
    }
  }

  // Get app version
  static async getAppVersion(): Promise<string> {
    try {
      const version = await this.getConfig('app_version');
      return version || '1.0.0';
    } catch (error) {
      console.error('Failed to get app version:', error);
      return '1.0.0';
    }
  }

  // Check if maintenance mode is enabled
  static async isMaintenanceMode(): Promise<boolean> {
    try {
      const maintenanceMode = await this.getConfig('maintenance_mode');
      return maintenanceMode || false;
    } catch (error) {
      console.error('Failed to check maintenance mode:', error);
      return false;
    }
  }

  // Get rate limit
  static async getRateLimit(): Promise<number> {
    try {
      const rateLimit = await this.getConfig('rate_limit_requests_per_minute');
      return rateLimit || 100;
    } catch (error) {
      console.error('Failed to get rate limit:', error);
      return 100;
    }
  }

  // Get cache TTL
  static async getCacheTTL(): Promise<number> {
    try {
      const ttl = await this.getConfig('cache_ttl_seconds');
      return ttl || 3600;
    } catch (error) {
      console.error('Failed to get cache TTL:', error);
      return 3600;
    }
  }

  // Get max file size
  static async getMaxFileSize(): Promise<number> {
    try {
      const maxSize = await this.getConfig('max_file_size_mb');
      return maxSize || 100;
    } catch (error) {
      console.error('Failed to get max file size:', error);
      return 100;
    }
  }

  // Get session timeout
  static async getSessionTimeout(): Promise<number> {
    try {
      const timeout = await this.getConfig('session_timeout_minutes');
      return timeout || 30;
    } catch (error) {
      console.error('Failed to get session timeout:', error);
      return 30;
    }
  }

  // Get default AI provider
  static async getDefaultAIProvider(): Promise<string> {
    try {
      const provider = await this.getConfig('ai_provider_default');
      return provider || 'openai';
    } catch (error) {
      console.error('Failed to get default AI provider:', error);
      return 'openai';
    }
  }
}

export default SystemConfigService;
