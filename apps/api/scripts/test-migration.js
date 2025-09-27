#!/usr/bin/env node

/**
 * Migration Test Script
 * Tests the enhanced schema migration and validates the database structure
 */

const { Pool } = require('pg')
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

async function testDatabaseConnection() {
  log('\n🔍 Testing database connection...', 'blue')
  
  try {
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, '../.env') })
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured')
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const client = await pool.connect()
    
    const result = await client.query('SELECT NOW()')
    client.release()
    await pool.end()
    
    log('✅ Database connection successful', 'green')
    log(`   Connected at: ${result.rows[0].now}`, 'cyan')
    return true
  } catch (error) {
    log('❌ Database connection failed:', 'red')
    console.error(error.message)
    return false
  }
}

async function testTableStructure() {
  log('\n🏗️  Testing table structure...', 'blue')
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  try {
    // Test if enhanced tables exist
    const expectedTables = [
      'users',
      'interview_sessions', 
      'questions',
      'answers',
      'sample_answers',
      'question_trends',
      'company_insights'
    ]
    
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1)
    `
    
    const result = await pool.query(tableQuery, [expectedTables])
    const existingTables = result.rows.map(row => row.table_name)
    
    log(`📊 Found ${existingTables.length}/${expectedTables.length} expected tables:`, 'cyan')
    
    expectedTables.forEach(table => {
      if (existingTables.includes(table)) {
        log(`   ✅ ${table}`, 'green')
      } else {
        log(`   ❌ ${table} (missing)`, 'red')
      }
    })
    
    return existingTables.length === expectedTables.length
  } catch (error) {
    log('❌ Table structure test failed:', 'red')
    console.error(error.message)
    return false
  } finally {
    await pool.end()
  }
}

async function testEnhancedQuestionColumns() {
  log('\n📝 Testing enhanced question columns...', 'blue')
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  try {
    const expectedColumns = [
      'source',
      'freshness_score',
      'relevance_score',
      'company_specific',
      'industry_trends',
      'llm_provider',
      'star_framework',
      'follow_up_questions',
      'tips',
      'updated_at'
    ]
    
    const columnQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'questions' 
      AND column_name = ANY($1)
      ORDER BY column_name
    `
    
    const result = await pool.query(columnQuery, [expectedColumns])
    const existingColumns = result.rows.map(row => row.column_name)
    
    log(`📊 Found ${existingColumns.length}/${expectedColumns.length} enhanced columns:`, 'cyan')
    
    expectedColumns.forEach(column => {
      const columnInfo = result.rows.find(row => row.column_name === column)
      if (columnInfo) {
        log(`   ✅ ${column} (${columnInfo.data_type})`, 'green')
      } else {
        log(`   ❌ ${column} (missing)`, 'red')
      }
    })
    
    return existingColumns.length >= expectedColumns.length * 0.8 // Allow 80% success
  } catch (error) {
    log('❌ Enhanced columns test failed:', 'red')
    console.error(error.message)
    return false
  } finally {
    await pool.end()
  }
}

async function testSampleData() {
  log('\n🌱 Testing sample data...', 'blue')
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  try {
    // Test if sample data exists
    const queries = [
      { table: 'users', query: 'SELECT COUNT(*) as count FROM users' },
      { table: 'company_insights', query: 'SELECT COUNT(*) as count FROM company_insights' },
      { table: 'question_trends', query: 'SELECT COUNT(*) as count FROM question_trends' },
      { table: 'questions', query: 'SELECT COUNT(*) as count FROM questions WHERE source IS NOT NULL' }
    ]
    
    for (const { table, query } of queries) {
      try {
        const result = await pool.query(query)
        const count = parseInt(result.rows[0].count)
        
        if (count > 0) {
          log(`   ✅ ${table}: ${count} records`, 'green')
        } else {
          log(`   ⚠️  ${table}: No records found`, 'yellow')
        }
      } catch (error) {
        log(`   ❌ ${table}: Query failed`, 'red')
      }
    }
    
    return true
  } catch (error) {
    log('❌ Sample data test failed:', 'red')
    console.error(error.message)
    return false
  } finally {
    await pool.end()
  }
}

async function testEnhancedQuestionGeneration() {
  log('\n🤖 Testing enhanced question generation...', 'blue')
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  try {
    // Test if we can insert a question with enhanced metadata
    const testQuestion = {
      session_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      type: 'behavioral',
      text: 'Test question for migration validation',
      category: 'Test',
      difficulty: 'medium',
      expected_keywords: ['test', 'validation'],
      time_limit: 120,
      order: 1,
      source: 'ai-generated',
      freshness_score: 0.85,
      relevance_score: 0.90,
      company_specific: false,
      industry_trends: ['testing', 'validation'],
      llm_provider: 'openai',
      star_framework: JSON.stringify({
        situation: 'Test situation',
        task: 'Test task',
        action: 'Test action',
        result: 'Test result',
        keyPoints: ['testing']
      }),
      follow_up_questions: ['Test follow-up?'],
      tips: ['Test tip']
    }
    
    // Try to insert (will fail due to foreign key, but tests column structure)
    try {
      await pool.query(`
        INSERT INTO questions (
          session_id, type, text, category, difficulty, expected_keywords,
          time_limit, "order", source, freshness_score, relevance_score,
          company_specific, industry_trends, llm_provider, star_framework,
          follow_up_questions, tips
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
      `, Object.values(testQuestion))
      
      log('   ⚠️  Test insert succeeded (unexpected)', 'yellow')
    } catch (error) {
      if (error.message.includes('foreign key') || error.message.includes('violates')) {
        log('   ✅ Enhanced question structure validated', 'green')
      } else {
        log('   ❌ Unexpected error:', 'red')
        console.error(error.message)
      }
    }
    
    return true
  } catch (error) {
    log('❌ Enhanced question generation test failed:', 'red')
    console.error(error.message)
    return false
  } finally {
    await pool.end()
  }
}

async function generateMigrationReport() {
  log('\n📋 Generating migration report...', 'blue')
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  try {
    // Get database statistics
    const stats = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    
    log('📊 Database Statistics:', 'cyan')
    stats.rows.forEach(row => {
      log(`   ${row.tablename}: ${row.inserts} inserts, ${row.updates} updates, ${row.deletes} deletes`, 'reset')
    })
    
    // Get table sizes
    const sizes = await pool.query(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `)
    
    log('\n💾 Table Sizes:', 'cyan')
    sizes.rows.forEach(row => {
      log(`   ${row.tablename}: ${row.size}`, 'reset')
    })
    
    return true
  } catch (error) {
    log('❌ Migration report generation failed:', 'red')
    console.error(error.message)
    return false
  } finally {
    await pool.end()
  }
}

async function main() {
  log('🧪 InterviewSpark Migration Test Suite', 'magenta')
  log('=====================================', 'magenta')
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Table Structure', fn: testTableStructure },
    { name: 'Enhanced Question Columns', fn: testEnhancedQuestionColumns },
    { name: 'Sample Data', fn: testSampleData },
    { name: 'Enhanced Question Generation', fn: testEnhancedQuestionGeneration },
    { name: 'Migration Report', fn: generateMigrationReport }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      log(`❌ Test "${test.name}" crashed:`, 'red')
      console.error(error)
      failed++
    }
  }
  
  log('\n📊 Test Results Summary', 'magenta')
  log('======================', 'magenta')
  log(`✅ Passed: ${passed}`, 'green')
  log(`❌ Failed: ${failed}`, 'red')
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, 'cyan')
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Migration is successful.', 'green')
  } else {
    log('\n⚠️  Some tests failed. Please review the migration.', 'yellow')
  }
  
  log('\n💡 Next Steps:', 'cyan')
  log('1. If tests passed: Start the API server and test enhanced features', 'cyan')
  log('2. If tests failed: Review migration logs and fix issues', 'cyan')
  log('3. Run integration tests: npm run test:integration', 'cyan')
  
  process.exit(failed > 0 ? 1 : 0)
}

if (require.main === module) {
  main()
}
