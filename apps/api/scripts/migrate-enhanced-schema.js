#!/usr/bin/env node

/**
 * Enhanced Schema Migration Script
 * Migrates the database to support enhanced question generation features
 */

const { execSync } = require('child_process')
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

function runCommand(command, description) {
  try {
    log(`\n${description}...`, 'blue')
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    })
    log(`✅ ${description} completed`, 'green')
    return output
  } catch (error) {
    log(`❌ ${description} failed:`, 'red')
    console.error(error.message)
    throw error
  }
}

function checkDatabaseConnection() {
  try {
    log('\n🔍 Checking database connection...', 'blue')
    
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, '../.env') })
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured')
    }
    
    log('✅ Database configuration found', 'green')
    return true
  } catch (error) {
    log('❌ Database connection check failed:', 'red')
    console.error(error.message)
    return false
  }
}

function backupCurrentSchema() {
  try {
    log('\n💾 Creating schema backup...', 'blue')
    
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `schema-backup-${timestamp}.sql`)
    
    // Create a simple backup by dumping the current schema
    const databaseUrl = process.env.DATABASE_URL
    if (databaseUrl) {
      try {
        const pgDumpCommand = `pg_dump "${databaseUrl}" --schema-only > "${backupFile}"`
        execSync(pgDumpCommand, { stdio: 'pipe' })
        log(`✅ Schema backup created: ${backupFile}`, 'green')
      } catch (error) {
        log('⚠️  Could not create pg_dump backup (pg_dump not available)', 'yellow')
      }
    }
    
    return backupFile
  } catch (error) {
    log('⚠️  Schema backup failed (continuing anyway):', 'yellow')
    console.warn(error.message)
    return null
  }
}

function generateMigration() {
  try {
    log('\n🔄 Generating migration for enhanced schema...', 'blue')
    
    // Generate migration using drizzle-kit
    const output = runCommand('npm run db:generate', 'Generate migration')
    
    // Check if migration was generated
    const migrationsDir = path.join(__dirname, '../src/database/migrations')
    const files = fs.readdirSync(migrationsDir)
    const sqlFiles = files.filter(f => f.endsWith('.sql'))
    
    if (sqlFiles.length > 0) {
      const latestMigration = sqlFiles.sort().pop()
      log(`📄 Migration generated: ${latestMigration}`, 'cyan')
      return latestMigration
    } else {
      log('ℹ️  No new migration needed (schema is up to date)', 'cyan')
      return null
    }
  } catch (error) {
    log('❌ Migration generation failed:', 'red')
    throw error
  }
}

function runMigration() {
  try {
    log('\n🚀 Running database migration...', 'blue')
    
    // Run migration using drizzle-kit
    runCommand('npm run db:migrate', 'Apply migration')
    
    log('✅ Database migration completed successfully', 'green')
    return true
  } catch (error) {
    log('❌ Migration failed:', 'red')
    throw error
  }
}

function validateMigration() {
  try {
    log('\n✅ Validating migration...', 'blue')
    
    // Run a simple validation query to check if new tables exist
    const { Pool } = require('pg')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    
    return new Promise((resolve, reject) => {
      pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('sample_answers', 'question_trends', 'company_insights')
      `, (err, result) => {
        pool.end()
        
        if (err) {
          reject(err)
          return
        }
        
        const tables = result.rows.map(row => row.table_name)
        
        if (tables.length >= 3) {
          log('✅ Enhanced tables created successfully', 'green')
          log(`   Found tables: ${tables.join(', ')}`, 'cyan')
        } else {
          log('⚠️  Some enhanced tables may not have been created', 'yellow')
          log(`   Found tables: ${tables.join(', ')}`, 'cyan')
        }
        
        // Check if questions table has new columns
        pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'questions' 
          AND column_name IN ('source', 'freshness_score', 'relevance_score', 'star_framework')
        `, (err, result) => {
          if (err) {
            reject(err)
            return
          }
          
          const columns = result.rows.map(row => row.column_name)
          
          if (columns.length >= 4) {
            log('✅ Enhanced question columns added successfully', 'green')
            log(`   Found columns: ${columns.join(', ')}`, 'cyan')
          } else {
            log('⚠️  Some enhanced question columns may not have been added', 'yellow')
            log(`   Found columns: ${columns.join(', ')}`, 'cyan')
          }
          
          resolve(true)
        })
      })
    })
  } catch (error) {
    log('❌ Migration validation failed:', 'red')
    throw error
  }
}

function seedSampleData() {
  try {
    log('\n🌱 Seeding sample data...', 'blue')
    
    // Run the seed script if it exists
    const seedScript = path.join(__dirname, '../src/database/seed.ts')
    if (fs.existsSync(seedScript)) {
      runCommand('npm run db:seed', 'Seed sample data')
    } else {
      log('ℹ️  No seed script found, skipping sample data', 'cyan')
    }
    
    return true
  } catch (error) {
    log('⚠️  Seeding failed (continuing anyway):', 'yellow')
    console.warn(error.message)
    return false
  }
}

async function main() {
  log('🗄️  InterviewSpark Enhanced Schema Migration', 'magenta')
  log('============================================', 'magenta')
  
  try {
    // Step 1: Check database connection
    if (!checkDatabaseConnection()) {
      log('\n❌ Cannot proceed without database connection', 'red')
      log('Please configure DATABASE_URL in your .env file', 'yellow')
      process.exit(1)
    }
    
    // Step 2: Backup current schema
    const backupFile = backupCurrentSchema()
    
    // Step 3: Generate migration
    const migrationFile = generateMigration()
    
    // Step 4: Run migration
    if (migrationFile || process.argv.includes('--force')) {
      await runMigration()
      
      // Step 5: Validate migration
      await validateMigration()
      
      // Step 6: Seed sample data (optional)
      if (process.argv.includes('--seed')) {
        seedSampleData()
      }
      
      log('\n🎉 Migration completed successfully!', 'green')
      log('==========================================', 'green')
      
      log('\n📋 Next Steps:', 'cyan')
      log('1. Restart your API server', 'cyan')
      log('2. Test the enhanced question generation features', 'cyan')
      log('3. Run integration tests: npm run test:integration', 'cyan')
      
      if (backupFile) {
        log(`\n💾 Schema backup saved to: ${backupFile}`, 'blue')
      }
      
    } else {
      log('\n✅ Database schema is already up to date', 'green')
      log('No migration needed.', 'cyan')
    }
    
  } catch (error) {
    log('\n❌ Migration failed:', 'red')
    console.error(error)
    
    log('\n🔧 Troubleshooting:', 'yellow')
    log('1. Check your DATABASE_URL configuration', 'yellow')
    log('2. Ensure PostgreSQL is running', 'yellow')
    log('3. Verify database permissions', 'yellow')
    log('4. Check the migration logs above for specific errors', 'yellow')
    
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
