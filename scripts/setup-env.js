#!/usr/bin/env node

/**
 * Environment Setup Script
 * Interactive script to help users configure their environment variables
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

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

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve)
  })
}

async function setupLLMProviders() {
  log('\n🤖 LLM Providers Setup', 'blue')
  log('=====================', 'blue')
  
  const providers = {
    openai: {
      name: 'OpenAI GPT-4',
      keyVar: 'OPENAI_API_KEY',
      description: 'Best for behavioral and complex reasoning questions',
      getKeyUrl: 'https://platform.openai.com/api-keys'
    },
    gemini: {
      name: 'Google Gemini Pro',
      keyVar: 'GEMINI_API_KEY',
      description: 'Best for technical and analytical questions',
      getKeyUrl: 'https://makersuite.google.com/app/apikey'
    },
    anthropic: {
      name: 'Anthropic Claude',
      keyVar: 'ANTHROPIC_API_KEY',
      description: 'Best for company-specific and nuanced questions',
      getKeyUrl: 'https://console.anthropic.com/account/keys'
    }
  }
  
  const config = {}
  
  for (const [key, provider] of Object.entries(providers)) {
    log(`\n${provider.name}`, 'cyan')
    log(`Description: ${provider.description}`, 'reset')
    log(`Get API key: ${provider.getKeyUrl}`, 'yellow')
    
    const hasKey = await question('Do you have an API key for this provider? (y/n): ')
    
    if (hasKey.toLowerCase() === 'y' || hasKey.toLowerCase() === 'yes') {
      const apiKey = await question('Enter your API key: ')
      if (apiKey.trim()) {
        config[provider.keyVar] = apiKey.trim()
        config[`NEXT_PUBLIC_${provider.keyVar}`] = apiKey.trim()
        log('✅ API key saved', 'green')
      }
    } else {
      log('⏭️  Skipping this provider', 'yellow')
    }
  }
  
  return config
}

async function setupDatabase() {
  log('\n🗄️  Database Setup', 'blue')
  log('================', 'blue')
  
  const config = {}
  
  log('PostgreSQL database configuration:')
  
  const useDefault = await question('Use default local PostgreSQL settings? (y/n): ')
  
  if (useDefault.toLowerCase() === 'y' || useDefault.toLowerCase() === 'yes') {
    const dbName = await question('Database name [interviewspark]: ') || 'interviewspark'
    const dbUser = await question('Database user [postgres]: ') || 'postgres'
    const dbPassword = await question('Database password: ')
    
    config.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`
    config.DB_HOST = 'localhost'
    config.DB_PORT = '5432'
    config.DB_NAME = dbName
    config.DB_USER = dbUser
    config.DB_PASSWORD = dbPassword
  } else {
    const dbUrl = await question('Enter full DATABASE_URL: ')
    if (dbUrl.trim()) {
      config.DATABASE_URL = dbUrl.trim()
    }
  }
  
  return config
}

async function setupOptionalServices() {
  log('\n⚙️  Optional Services Setup', 'blue')
  log('==========================', 'blue')
  
  const config = {}
  
  // Redis for caching
  const useRedis = await question('Enable Redis caching? (y/n): ')
  if (useRedis.toLowerCase() === 'y' || useRedis.toLowerCase() === 'yes') {
    const redisUrl = await question('Redis URL [redis://localhost:6379]: ') || 'redis://localhost:6379'
    config.REDIS_URL = redisUrl
    config.CACHE_ENABLED = 'true'
    log('✅ Redis caching enabled', 'green')
  }
  
  // Web scraping
  const useWebScraping = await question('Enable web scraping for trending questions? (y/n): ')
  if (useWebScraping.toLowerCase() === 'y' || useWebScraping.toLowerCase() === 'yes') {
    config.NEXT_PUBLIC_ENABLE_WEB_SCRAPING = 'true'
    config.WEB_SCRAPING_ENABLED = 'true'
    log('✅ Web scraping enabled', 'green')
  }
  
  // Analytics
  const useAnalytics = await question('Enable analytics and monitoring? (y/n): ')
  if (useAnalytics.toLowerCase() === 'y' || useAnalytics.toLowerCase() === 'yes') {
    config.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true'
    config.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING = 'true'
    config.NEXT_PUBLIC_ENABLE_QUESTION_METRICS = 'true'
    log('✅ Analytics enabled', 'green')
  }
  
  return config
}

async function setupSecurity() {
  log('\n🔒 Security Setup', 'blue')
  log('================', 'blue')
  
  const config = {}
  
  // Generate JWT secret
  const generateJWT = await question('Generate a secure JWT secret? (y/n): ')
  if (generateJWT.toLowerCase() === 'y' || generateJWT.toLowerCase() === 'yes') {
    const crypto = require('crypto')
    config.JWT_SECRET = crypto.randomBytes(64).toString('hex')
    log('✅ JWT secret generated', 'green')
  } else {
    const jwtSecret = await question('Enter your JWT secret (min 32 characters): ')
    if (jwtSecret.trim() && jwtSecret.length >= 32) {
      config.JWT_SECRET = jwtSecret.trim()
    } else {
      log('⚠️  JWT secret too short, using generated one', 'yellow')
      const crypto = require('crypto')
      config.JWT_SECRET = crypto.randomBytes(64).toString('hex')
    }
  }
  
  return config
}

function writeEnvFile(filePath, config) {
  try {
    // Read existing .env.example file
    const examplePath = filePath + '.example'
    let content = ''
    
    if (fs.existsSync(examplePath)) {
      content = fs.readFileSync(examplePath, 'utf8')
    }
    
    // Replace placeholder values with actual config
    Object.entries(config).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (content.match(regex)) {
        content = content.replace(regex, `${key}=${value}`)
      } else {
        content += `\n${key}=${value}`
      }
    })
    
    fs.writeFileSync(filePath, content)
    return true
  } catch (error) {
    console.error('Error writing .env file:', error)
    return false
  }
}

async function main() {
  log('🚀 InterviewSpark Environment Setup', 'magenta')
  log('===================================', 'magenta')
  log('This script will help you configure your environment variables.', 'reset')
  log('You can skip any section and configure it manually later.\n', 'reset')
  
  try {
    // Collect all configuration
    const llmConfig = await setupLLMProviders()
    const dbConfig = await setupDatabase()
    const servicesConfig = await setupOptionalServices()
    const securityConfig = await setupSecurity()
    
    const allConfig = {
      ...llmConfig,
      ...dbConfig,
      ...servicesConfig,
      ...securityConfig
    }
    
    // Set some defaults
    allConfig.NODE_ENV = 'development'
    allConfig.NEXT_PUBLIC_DEBUG_MODE = 'false'
    allConfig.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    allConfig.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api'
    
    log('\n📝 Writing Configuration Files', 'blue')
    log('==============================', 'blue')
    
    // Write web app .env file
    const webEnvPath = path.join(__dirname, '../apps/web/.env')
    if (writeEnvFile(webEnvPath, allConfig)) {
      log('✅ Web app .env file created', 'green')
    } else {
      log('❌ Failed to create web app .env file', 'red')
    }
    
    // Write API .env file
    const apiEnvPath = path.join(__dirname, '../apps/api/.env')
    if (writeEnvFile(apiEnvPath, allConfig)) {
      log('✅ API .env file created', 'green')
    } else {
      log('❌ Failed to create API .env file', 'red')
    }
    
    log('\n🎉 Setup Complete!', 'green')
    log('==================', 'green')
    
    log('\n📋 Next Steps:', 'cyan')
    log('1. Review the generated .env files', 'cyan')
    log('2. Run: npm run validate-config', 'cyan')
    log('3. Run: npm run migrate-db', 'cyan')
    log('4. Start the development server: npm run dev', 'cyan')
    
    if (Object.keys(llmConfig).length === 0) {
      log('\n⚠️  Warning: No LLM providers configured', 'yellow')
      log('You will need to add at least one API key to use enhanced question generation.', 'yellow')
    }
    
  } catch (error) {
    log('\n❌ Setup failed:', 'red')
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

if (require.main === module) {
  main()
}
