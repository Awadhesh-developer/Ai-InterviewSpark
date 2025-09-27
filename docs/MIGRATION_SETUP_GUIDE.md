# Database Migration Setup Guide

## Overview
This guide will help you run the database migration to add all the missing fields and connections we identified in the verification process.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Environment variables configured (DATABASE_URL)

## Step 1: Check Environment Variables
Make sure your `.env` file in `apps/api/` contains:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/ai_interviewspark
```

## Step 2: Run the Migration
Execute the migration command from the project root:

```bash
npm run db:migrate
```

This will:
- Run the migration script that adds all missing fields
- Create 6 new tables for enhanced functionality
- Add 50+ new fields across existing tables
- Create indexes and constraints for performance
- Set up views for common queries

## Step 3: Verify the Migration
After the migration completes, verify everything was created correctly:

```bash
npm run db:verify
```

This will check:
- All new tables exist
- All new columns were added
- Indexes were created
- Views were created
- Overall migration success

## Step 4: Test the Application
Start the application to ensure everything works:

```bash
# Start the API server
npm run dev:api

# In another terminal, start the web app
npm run dev:web
```

## What Gets Added

### New Tables (6)
1. **push_subscriptions** - Push notification management
2. **websocket_connections** - Real-time connection tracking
3. **performance_metrics_data** - Detailed performance monitoring
4. **cache_entries** - Cache management system
5. **user_activities** - Comprehensive activity tracking
6. **system_configurations** - Dynamic system settings
7. **audit_logs** - Complete audit trail

### Enhanced Tables
- **users** - Added notification preferences, user settings, phone number, status tracking
- **interview_sessions** - Added real-time session state and live data tracking
- **notifications** - Added priority, delivery status, retry logic
- **questions** - Added metadata, analytics, and performance tracking
- **answers** - Added quality scoring and confidence tracking
- **feedback** - Added detailed analysis fields
- **resumes** - Added analysis metadata and optimization suggestions

### New Features Enabled
- ✅ Push notification subscriptions
- ✅ Real-time session state management
- ✅ User activity tracking and audit logging
- ✅ Enhanced notification preferences
- ✅ Performance monitoring and analytics
- ✅ System configuration management
- ✅ Cache management
- ✅ WebSocket connection tracking

## Troubleshooting

### If Migration Fails
1. Check database connection:
   ```bash
   npm run db:health
   ```

2. Check if tables already exist:
   ```bash
   npm run db:verify
   ```

3. Manual cleanup (if needed):
   ```sql
   -- Connect to your database and run:
   DROP TABLE IF EXISTS push_subscriptions CASCADE;
   DROP TABLE IF EXISTS websocket_connections CASCADE;
   DROP TABLE IF EXISTS performance_metrics_data CASCADE;
   DROP TABLE IF EXISTS cache_entries CASCADE;
   DROP TABLE IF EXISTS user_activities CASCADE;
   DROP TABLE IF EXISTS system_configurations CASCADE;
   DROP TABLE IF EXISTS audit_logs CASCADE;
   ```

### If Verification Fails
1. Check specific missing items from the verification output
2. Re-run the migration: `npm run db:migrate`
3. Check database permissions and connectivity

## Expected Output

### Successful Migration
```
🚀 Starting database migration...
📄 Migration file loaded successfully
📊 Found 50+ migration statements
⏳ Executing statement 1/50...
✅ Statement 1 executed successfully
...
🎉 Migration completed successfully!
🔍 Verifying migration...
✅ Table 'push_subscriptions' created successfully
✅ Table 'websocket_connections' created successfully
...
🎯 Migration verification completed!
```

### Successful Verification
```
🔍 Verifying database migration...

📋 Checking new tables...
✅ Table 'push_subscriptions' exists
✅ Table 'websocket_connections' exists
...

👤 Checking new user table columns...
✅ Column 'users.phone_number' exists
✅ Column 'users.notification_preferences' exists
...

📈 MIGRATION VERIFICATION SUMMARY
==================================================
Total Checks: 50+
Passed: 50+
Failed: 0
Success Rate: 100.0%

🎉 All migration checks passed! Database is ready.
```

## Next Steps
After successful migration:
1. Update your frontend to use the new fields
2. Test all functionality with the new database schema
3. Monitor performance with the new indexes
4. Set up monitoring for the new audit logs

## Support
If you encounter any issues:
1. Check the migration logs for specific errors
2. Verify your database connection and permissions
3. Ensure all environment variables are set correctly
4. Check that PostgreSQL is running and accessible
