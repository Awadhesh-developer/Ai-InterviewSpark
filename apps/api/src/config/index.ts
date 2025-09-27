// --- START api/config/index.ts --- //
// Configuration module for AI-InterviewSpark API
// Centralizes all environment variables and application settings

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('localhost'),
  
  // Database configuration
  DATABASE_URL: z.string(),
  DATABASE_SSL: z.string().transform(val => val === 'true').default('false'),
  
  // Authentication - JWT Secrets
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_VERIFICATION_SECRET: z.string().min(32),
  JWT_RESET_SECRET: z.string().min(32),
  JWT_SESSION_SECRET: z.string().min(32),
  JWT_API_SECRET: z.string().min(32),
  JWT_WEBSOCKET_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),

  // OAuth Configuration
  OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
  OAUTH_FACEBOOK_APP_ID: z.string().optional(),
  OAUTH_FACEBOOK_APP_SECRET: z.string().optional(),
  OAUTH_LINKEDIN_CLIENT_ID: z.string().optional(),
  OAUTH_LINKEDIN_CLIENT_SECRET: z.string().optional(),
  OAUTH_REDIRECT_BASE_URL: z.string().default('http://localhost:3001'),
  OAUTH_SUCCESS_REDIRECT_URL: z.string().default('http://localhost:3000/auth/oauth/success'),
  OAUTH_FAILURE_REDIRECT_URL: z.string().default('http://localhost:3000/auth/oauth/error'),
  TOKEN_ENCRYPTION_KEY: z.string().default('default-key-change-in-production'),
  
  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  MOTIVEL_API_KEY: z.string().optional(),
  MOODME_API_KEY: z.string().optional(),
  
  // Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // External Services
  SENDGRID_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // WebSocket
  WS_PORT: z.string().transform(Number).default('3002'),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Feature flags
  ENABLE_EMOTIONAL_ANALYSIS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_PEER_SESSIONS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_EXPERT_SESSIONS: z.string().transform(val => val === 'true').default('false'),
});

// Validate environment variables
const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
  console.error('❌ Invalid environment variables:', envValidation.error.format());
  process.exit(1);
}

const env = envValidation.data;

// Helper to generate a random secret
function generateRandomSecret(length = 64) {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join('');
}

// JWT Secrets validation and auto-generation
const jwtSecrets = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_VERIFICATION_SECRET: process.env.JWT_VERIFICATION_SECRET,
  JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
  JWT_SESSION_SECRET: process.env.JWT_SESSION_SECRET,
  JWT_API_SECRET: process.env.JWT_API_SECRET,
  JWT_WEBSOCKET_SECRET: process.env.JWT_WEBSOCKET_SECRET,
};

// Check if any JWT secrets are missing or too short
const missingSecrets = Object.entries(jwtSecrets).filter(([key, value]) => 
  !value || value.length < 32
);

if (missingSecrets.length > 0) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Some JWT secrets are missing or too short. Auto-generating secure secrets for development.');
    missingSecrets.forEach(([key]) => {
      const generated = generateRandomSecret(64);
      process.env[key] = generated;
      console.warn(`   Generated ${key}: ${generated.substring(0, 8)}...`);
    });
  } else {
    const missingKeys = missingSecrets.map(([key]) => key).join(', ');
    throw new Error(`JWT secrets must be set and at least 32 characters in production! Missing: ${missingKeys}`);
  }
}

// Application configuration
export const config = {
  // Server
  server: {
    port: env.PORT,
    host: env.HOST,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  
  // Database
  database: {
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
    maxConnections: 20,
    minConnections: 5,
  },
  
  // Redis
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    enabled: !!env.REDIS_URL, // Only enable if explicit REDIS_URL is provided
  },
  
  // Authentication
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    clerk: {
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    },
    oauth: {
      google: {
        clientId: env.OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: env.OAUTH_GOOGLE_CLIENT_SECRET,
        enabled: !!(env.OAUTH_GOOGLE_CLIENT_ID && env.OAUTH_GOOGLE_CLIENT_SECRET),
      },
      facebook: {
        appId: env.OAUTH_FACEBOOK_APP_ID,
        appSecret: env.OAUTH_FACEBOOK_APP_SECRET,
        enabled: !!(env.OAUTH_FACEBOOK_APP_ID && env.OAUTH_FACEBOOK_APP_SECRET),
      },
      linkedin: {
        clientId: env.OAUTH_LINKEDIN_CLIENT_ID,
        clientSecret: env.OAUTH_LINKEDIN_CLIENT_SECRET,
        enabled: !!(env.OAUTH_LINKEDIN_CLIENT_ID && env.OAUTH_LINKEDIN_CLIENT_SECRET),
      },
      redirectBaseUrl: env.OAUTH_REDIRECT_BASE_URL,
      successRedirectUrl: env.OAUTH_SUCCESS_REDIRECT_URL,
      failureRedirectUrl: env.OAUTH_FAILURE_REDIRECT_URL,
    },
  },

  // JWT Configuration
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessSecret: env.JWT_ACCESS_SECRET,
    verificationSecret: env.JWT_VERIFICATION_SECRET,
    resetSecret: env.JWT_RESET_SECRET,
    sessionSecret: env.JWT_SESSION_SECRET,
    apiSecret: env.JWT_API_SECRET,
    websocketSecret: env.JWT_WEBSOCKET_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  // Security
  security: {
    tokenEncryptionKey: env.TOKEN_ENCRYPTION_KEY,
  },
  
  // AI Services
  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      enabled: !!env.OPENAI_API_KEY,
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
      enabled: !!env.GEMINI_API_KEY,
    },
    motivel: {
      apiKey: env.MOTIVEL_API_KEY,
      enabled: !!env.MOTIVEL_API_KEY,
    },
    moodme: {
      apiKey: env.MOODME_API_KEY,
      enabled: !!env.MOODME_API_KEY,
    },
    perplexity: {
      apiKey: process.env.PERPLEXITY_API_KEY,
      model: process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-small-128k-online',
      maxTokens: parseInt(process.env.PERPLEXITY_MAX_TOKENS || '4000'),
      enabled: !!process.env.PERPLEXITY_API_KEY,
    },
  },
  
  // Storage
  storage: {
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      s3Bucket: env.AWS_S3_BUCKET,
      enabled: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET),
    },
  },
  
  // External Services
  services: {
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY,
      enabled: !!env.SENDGRID_API_KEY,
    },
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
      enabled: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER),
    },
  },
  
  // WebSocket
  websocket: {
    port: env.WS_PORT,
  },
  
  // Security Configuration
  securityConfig: {
    corsOrigin: env.CORS_ORIGIN,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
  },
  
  // Feature flags
  features: {
    emotionalAnalysis: env.ENABLE_EMOTIONAL_ANALYSIS,
    peerSessions: env.ENABLE_PEER_SESSIONS,
    expertSessions: env.ENABLE_EXPERT_SESSIONS,
  },
} as const;

// Type for the config object
export type Config = typeof config;

// Helper function to get nested config values
export const getConfig = <T extends keyof Config>(
  key: T
): Config[T] => {
  return config[key];
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof Config['features']): boolean => {
  return config.features[feature];
};

// Helper function to check if an AI service is available
export const isAIServiceAvailable = (service: keyof Config['ai']): boolean => {
  return config.ai[service].enabled;
};

// Helper function to check if external service is available
export const isServiceAvailable = (service: keyof Config['services']): boolean => {
  return config.services[service].enabled;
};

export default config; 