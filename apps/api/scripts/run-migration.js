// --- START api/scripts/run-migration.js --- //
// Database migration runner script
// Runs the missing fields and connections migration

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../src/database/migrations/0003_missing_fields_and_connections.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📊 Found ${statements.length} migration statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          await sql.unsafe(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Check if it's a "already exists" error (which is okay)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    
    // Check if new tables exist
    const newTables = [
      'push_subscriptions',
      'websocket_connections', 
      'performance_metrics_data',
      'cache_entries',
      'user_activities',
      'system_configurations',
      'audit_logs'
    ];
    
    for (const table of newTables) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        `;
        
        if (result[0].exists) {
          console.log(`✅ Table '${table}' created successfully`);
        } else {
          console.log(`❌ Table '${table}' not found`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${table}':`, error.message);
      }
    }
    
    // Check if new columns exist in users table
    const newUserColumns = [
      'phone_number',
      'status',
      'last_activity_at',
      'notification_preferences',
      'user_settings'
    ];
    
    for (const column of newUserColumns) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = ${column}
          );
        `;
        
        if (result[0].exists) {
          console.log(`✅ Column 'users.${column}' added successfully`);
        } else {
          console.log(`❌ Column 'users.${column}' not found`);
        }
      } catch (error) {
        console.log(`❌ Error checking column 'users.${column}':`, error.message);
      }
    }
    
    console.log('🎯 Migration verification completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the migration
runMigration().catch(console.error);
