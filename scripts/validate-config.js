#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Validates all environment variables and configuration settings
 */

const fs = require('fs')
const path = require('path')

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const env = {}
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=')
        }
      }
    })
    
    return env
  } catch (error) {
    return null
  }
}

function validateLLMProviders(env) {
  const errors = []
  const warnings = []
  const providers = ['OPENAI', 'GEMINI', 'ANTHROPIC']
  
  log('\n🤖 Validating LLM Providers...', 'blue')
  
  let enabledProviders = 0
  
  providers.forEach(provider => {
    const apiKey = env[`${provider}_API_KEY`] || env[`NEXT_PUBLIC_${provider}_API_KEY`]
    const model = env[`${provider}_MODEL`]
    const maxTokens = env[`${provider}_MAX_TOKENS`]
    const temperature = env[`${provider}_TEMPERATURE`]
    
    if (apiKey && apiKey !== `your_${provider.toLowerCase()}_api_key_here`) {
      enabledProviders++
      log(`  ✅ ${provider}: Configured`, 'green')
      
      // Validate model settings
      if (!model) {
        warnings.push(`${provider}_MODEL not specified, using default`)
      }
      if (!maxTokens || isNaN(parseInt(maxTokens))) {
        warnings.push(`${provider}_MAX_TOKENS not specified or invalid, using default`)
      }
      if (!temperature || isNaN(parseFloat(temperature))) {
        warnings.push(`${provider}_TEMPERATURE not specified or invalid, using default`)
      }
    } else {
      log(`  ❌ ${provider}: Not configured`, 'red')
    }
  })
  
  if (enabledProviders === 0) {
    errors.push('No LLM providers are configured with valid API keys')
  } else {
    log(`  ℹ️  ${enabledProviders} provider(s) enabled`, 'cyan')
  }
  
  return { errors, warnings }
}

function validateDatabase(env) {
  const errors = []
  const warnings = []
  
  log('\n🗄️  Validating Database Configuration...', 'blue')
  
  const databaseUrl = env.DATABASE_URL
  if (!databaseUrl || databaseUrl === 'postgresql://username:password@localhost:5432/interviewspark') {
    errors.push('DATABASE_URL not configured or using default placeholder')
  } else {
    log('  ✅ Database URL: Configured', 'green')
  }
  
  // Validate individual database settings
  const dbSettings = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  dbSettings.forEach(setting => {
    if (!env[setting]) {
      warnings.push(`${setting} not specified`)
    }
  })
  
  return { errors, warnings }
}

function validateWebScraping(env) {
  const errors = []
  const warnings = []
  
  log('\n🌐 Validating Web Scraping Configuration...', 'blue')
  
  const enabled = env.NEXT_PUBLIC_ENABLE_WEB_SCRAPING === 'true' || env.WEB_SCRAPING_ENABLED === 'true'
  
  if (enabled) {
    log('  ✅ Web Scraping: Enabled', 'green')
    
    const rateLimit = parseInt(env.WEB_SCRAPING_RATE_LIMIT || '2000')
    if (rateLimit < 1000) {
      warnings.push('Web scraping rate limit is very low, may cause issues')
    }
    
    const platforms = [
      env.LINKEDIN_SCRAPING_ENABLED !== 'false',
      env.INDEED_SCRAPING_ENABLED !== 'false',
      env.GLASSDOOR_SCRAPING_ENABLED !== 'false'
    ]
    
    if (!platforms.some(enabled => enabled)) {
      errors.push('Web scraping enabled but no platforms configured')
    }
  } else {
    log('  ⚠️  Web Scraping: Disabled', 'yellow')
  }
  
  return { errors, warnings }
}

function validateCaching(env) {
  const errors = []
  const warnings = []
  
  log('\n💾 Validating Caching Configuration...', 'blue')
  
  const redisUrl = env.REDIS_URL
  const cachingEnabled = env.CACHE_ENABLED !== 'false' && !!redisUrl
  
  if (cachingEnabled) {
    if (redisUrl === 'redis://localhost:6379') {
      warnings.push('Using default Redis URL, ensure Redis is running locally')
    }
    log('  ✅ Caching: Enabled', 'green')
  } else {
    log('  ⚠️  Caching: Disabled (Redis not configured)', 'yellow')
  }
  
  return { errors, warnings }
}

function validateMonitoring(env) {
  const errors = []
  const warnings = []
  
  log('\n📊 Validating Monitoring Configuration...', 'blue')
  
  const analyticsEnabled = env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
  const performanceEnabled = env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'
  const errorReportingEnabled = env.ERROR_REPORTING_ENABLED === 'true'
  
  if (analyticsEnabled) {
    if (!env.ANALYTICS_API_KEY || env.ANALYTICS_API_KEY === 'your_analytics_api_key_here') {
      warnings.push('Analytics enabled but API key not configured')
    } else {
      log('  ✅ Analytics: Configured', 'green')
    }
  }
  
  if (performanceEnabled) {
    log('  ✅ Performance Monitoring: Enabled', 'green')
  }
  
  if (errorReportingEnabled) {
    if (!env.ERROR_REPORTING_API_KEY || env.ERROR_REPORTING_API_KEY === 'your_error_reporting_key_here') {
      warnings.push('Error reporting enabled but API key not configured')
    } else {
      log('  ✅ Error Reporting: Configured', 'green')
    }
  }
  
  return { errors, warnings }
}

function validateSecurity(env) {
  const errors = []
  const warnings = []
  
  log('\n🔒 Validating Security Configuration...', 'blue')
  
  const jwtSecret = env.JWT_SECRET
  if (!jwtSecret || jwtSecret === 'your_jwt_secret_here') {
    errors.push('JWT_SECRET not configured or using default placeholder')
  } else if (jwtSecret.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long')
  } else {
    log('  ✅ JWT Secret: Configured', 'green')
  }
  
  const nodeEnv = env.NODE_ENV
  if (nodeEnv === 'production') {
    if (env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      warnings.push('Debug mode is enabled in production')
    }
    if (env.VERBOSE_LOGGING === 'true') {
      warnings.push('Verbose logging is enabled in production')
    }
  }
  
  return { errors, warnings }
}

function main() {
  log('🔍 InterviewSpark Configuration Validator', 'magenta')
  log('==========================================', 'magenta')
  
  const webEnvPath = path.join(__dirname, '../apps/web/.env')
  const apiEnvPath = path.join(__dirname, '../apps/api/.env')
  
  // Load environment files
  const webEnv = loadEnvFile(webEnvPath) || {}
  const apiEnv = loadEnvFile(apiEnvPath) || {}
  const combinedEnv = { ...webEnv, ...apiEnv, ...process.env }
  
  if (!fs.existsSync(webEnvPath) && !fs.existsSync(apiEnvPath)) {
    log('\n❌ No .env files found. Please copy from .env.example files.', 'red')
    process.exit(1)
  }
  
  let allErrors = []
  let allWarnings = []
  
  // Run all validations
  const validations = [
    validateLLMProviders,
    validateDatabase,
    validateWebScraping,
    validateCaching,
    validateMonitoring,
    validateSecurity
  ]
  
  validations.forEach(validate => {
    const { errors, warnings } = validate(combinedEnv)
    allErrors.push(...errors)
    allWarnings.push(...warnings)
  })
  
  // Summary
  log('\n📋 Validation Summary', 'magenta')
  log('===================', 'magenta')
  
  if (allErrors.length === 0) {
    log('✅ Configuration is valid!', 'green')
  } else {
    log(`❌ Found ${allErrors.length} error(s):`, 'red')
    allErrors.forEach(error => log(`  • ${error}`, 'red'))
  }
  
  if (allWarnings.length > 0) {
    log(`⚠️  Found ${allWarnings.length} warning(s):`, 'yellow')
    allWarnings.forEach(warning => log(`  • ${warning}`, 'yellow'))
  }
  
  if (allErrors.length === 0 && allWarnings.length === 0) {
    log('🎉 Perfect configuration! No issues found.', 'green')
  }
  
  log('\n💡 Next Steps:', 'cyan')
  log('  1. Set up your API keys for enabled providers', 'cyan')
  log('  2. Configure your database connection', 'cyan')
  log('  3. Set up Redis for caching (optional but recommended)', 'cyan')
  log('  4. Configure monitoring services (optional)', 'cyan')
  log('  5. Run the database migration script', 'cyan')
  
  process.exit(allErrors.length > 0 ? 1 : 0)
}

if (require.main === module) {
  main()
}

module.exports = { validateLLMProviders, validateDatabase, validateWebScraping, validateCaching, validateMonitoring, validateSecurity }
