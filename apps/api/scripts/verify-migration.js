// --- START api/scripts/verify-migration.js --- //
// Migration verification script
// Verifies that all new fields and tables were created successfully

const postgres = require('postgres');
require('dotenv').config();

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

async function verifyMigration() {
  
  try {
    console.log('🔍 Verifying database migration...\n');
    
    let totalChecks = 0;
    let passedChecks = 0;
    
    // Check new tables
    console.log('📋 Checking new tables...');
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
      totalChecks++;
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        `;
        
        if (result[0].exists) {
          console.log(`✅ Table '${table}' exists`);
          passedChecks++;
        } else {
          console.log(`❌ Table '${table}' missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${table}':`, error.message);
      }
    }
    
    // Check new columns in users table
    console.log('\n👤 Checking new user table columns...');
    const newUserColumns = [
      'phone_number',
      'status',
      'last_activity_at',
      'email_verification_token',
      'password_reset_token',
      'password_reset_expires_at',
      'notification_preferences',
      'user_settings'
    ];
    
    for (const column of newUserColumns) {
      totalChecks++;
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
          console.log(`✅ Column 'users.${column}' exists`);
          passedChecks++;
        } else {
          console.log(`❌ Column 'users.${column}' missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking column 'users.${column}':`, error.message);
      }
    }
    
    // Check new columns in interview_sessions table
    console.log('\n🎯 Checking new interview_sessions columns...');
    const newSessionColumns = [
      'current_question_id',
      'session_state',
      'real_time_data'
    ];
    
    for (const column of newSessionColumns) {
      totalChecks++;
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'interview_sessions' 
            AND column_name = ${column}
          );
        `;
        
        if (result[0].exists) {
          console.log(`✅ Column 'interview_sessions.${column}' exists`);
          passedChecks++;
        } else {
          console.log(`❌ Column 'interview_sessions.${column}' missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking column 'interview_sessions.${column}':`, error.message);
      }
    }
    
    // Check new columns in notifications table
    console.log('\n🔔 Checking new notifications columns...');
    const newNotificationColumns = [
      'priority',
      'delivery_status',
      'delivery_attempts',
      'delivered_at',
      'read_at',
      'expires_at'
    ];
    
    for (const column of newNotificationColumns) {
      totalChecks++;
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = ${column}
          );
        `;
        
        if (result[0].exists) {
          console.log(`✅ Column 'notifications.${column}' exists`);
          passedChecks++;
        } else {
          console.log(`❌ Column 'notifications.${column}' missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking column 'notifications.${column}':`, error.message);
      }
    }
    
    // Check indexes
    console.log('\n📊 Checking indexes...');
    const indexes = [
      'idx_push_subscriptions_user_id',
      'idx_websocket_connections_user_id',
      'idx_performance_metrics_session_id',
      'idx_cache_entries_key',
      'idx_user_activities_user_id',
      'idx_system_configurations_key',
      'idx_audit_logs_user_id'
    ];
    
    for (const index of indexes) {
      totalChecks++;
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = ${index}
          );
        `;
        
        if (result[0].exists) {
          console.log(`✅ Index '${index}' exists`);
          passedChecks++;
        } else {
          console.log(`❌ Index '${index}' missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking index '${index}':`, error.message);
      }
    }
    
    // Check views
    console.log('\n👁️  Checking views...');
    const views = [
      'active_user_sessions',
      'user_activity_summary',
      'performance_metrics_summary'
    ];
    
    for (const view of views) {
      totalChecks++;
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        `;
        
        if (result[0].exists) {
          console.log(`✅ View '${view}' exists`);
          passedChecks++;
        } else {
          console.log(`❌ View '${view}' missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking view '${view}':`, error.message);
      }
    }
    
    // Summary
    console.log('\n📈 MIGRATION VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Failed: ${totalChecks - passedChecks}`);
    console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 All migration checks passed! Database is ready.');
    } else {
      console.log('\n⚠️  Some migration checks failed. Please review the output above.');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the verification
verifyMigration().catch(console.error);
