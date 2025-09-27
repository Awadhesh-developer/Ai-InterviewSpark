// --- START api/scripts/setup-database.js --- //
// Database setup script for AI-InterviewSpark
// Automates database creation, migration, and seeding

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'interviewspark'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command, description) {
  log(`\n${colors.cyan}🔄 ${description}...${colors.reset}`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) log(stdout, 'green');
    if (stderr) log(stderr, 'yellow');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function checkPostgreSQLConnection() {
  log(`\n${colors.blue}🔍 Checking PostgreSQL connection...${colors.reset}`);
  
  const testCommand = `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d postgres -c "SELECT version();"`;
  
  try {
    // Set password environment variable for psql
    process.env.PGPASSWORD = DB_CONFIG.password;
    const { stdout } = await execAsync(testCommand);
    log(`✅ PostgreSQL connection successful`, 'green');
    log(`📊 ${stdout.trim()}`, 'cyan');
    return true;
  } catch (error) {
    log(`❌ PostgreSQL connection failed: ${error.message}`, 'red');
    log(`💡 Make sure PostgreSQL is running and accessible`, 'yellow');
    return false;
  }
}

async function createDatabase() {
  log(`\n${colors.blue}🗄️  Creating database '${DB_CONFIG.database}'...${colors.reset}`);
  
  const createCommand = `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d postgres -c "CREATE DATABASE ${DB_CONFIG.database};"`;
  
  try {
    process.env.PGPASSWORD = DB_CONFIG.password;
    await execAsync(createCommand);
    log(`✅ Database '${DB_CONFIG.database}' created successfully`, 'green');
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      log(`ℹ️  Database '${DB_CONFIG.database}' already exists`, 'yellow');
      return true;
    }
    log(`❌ Failed to create database: ${error.message}`, 'red');
    return false;
  }
}

async function runMigrations() {
  log(`\n${colors.blue}🔄 Running database migrations...${colors.reset}`);
  
  const migrationCommand = 'npx drizzle-kit up:pg';
  
  try {
    const { stdout, stderr } = await execAsync(migrationCommand, { cwd: path.join(__dirname, '..') });
    if (stdout) log(stdout, 'green');
    if (stderr) log(stderr, 'yellow');
    log(`✅ Database migrations completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red');
    return false;
  }
}

async function generateMigrations() {
  log(`\n${colors.blue}📝 Generating database migrations...${colors.reset}`);
  
  const generateCommand = 'npx drizzle-kit generate:pg';
  
  try {
    const { stdout, stderr } = await execAsync(generateCommand, { cwd: path.join(__dirname, '..') });
    if (stdout) log(stdout, 'green');
    if (stderr) log(stderr, 'yellow');
    log(`✅ Database migrations generated`, 'green');
    return true;
  } catch (error) {
    log(`❌ Migration generation failed: ${error.message}`, 'red');
    return false;
  }
}

async function seedDatabase() {
  log(`\n${colors.blue}🌱 Seeding database with initial data...${colors.reset}`);
  
  const seedCommand = 'npx tsx src/database/seed.ts';
  
  try {
    const { stdout, stderr } = await execAsync(seedCommand, { cwd: path.join(__dirname, '..') });
    if (stdout) log(stdout, 'green');
    if (stderr) log(stderr, 'yellow');
    log(`✅ Database seeding completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ Database seeding failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDatabaseConnection() {
  log(`\n${colors.blue}🧪 Testing database connection...${colors.reset}`);
  
  const testCommand = `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -c "SELECT 'Database connection test successful' as status;"`;
  
  try {
    process.env.PGPASSWORD = DB_CONFIG.password;
    const { stdout } = await execAsync(testCommand);
    log(`✅ Database connection test successful`, 'green');
    log(`📊 ${stdout.trim()}`, 'cyan');
    return true;
  } catch (error) {
    log(`❌ Database connection test failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log(`${colors.bright}${colors.blue}🚀 AI-InterviewSpark Database Setup${colors.reset}`, 'blue');
  log(`${colors.cyan}================================${colors.reset}`, 'cyan');
  
  // Check if PostgreSQL is accessible
  const pgConnected = await checkPostgreSQLConnection();
  if (!pgConnected) {
    log(`\n${colors.red}❌ Cannot proceed without PostgreSQL connection${colors.reset}`, 'red');
    process.exit(1);
  }
  
  // Create database
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    log(`\n${colors.red}❌ Cannot proceed without database${colors.reset}`, 'red');
    process.exit(1);
  }
  
  // Generate migrations
  const migrationsGenerated = await generateMigrations();
  if (!migrationsGenerated) {
    log(`\n${colors.yellow}⚠️  Migration generation failed, but continuing...${colors.reset}`, 'yellow');
  }
  
  // Run migrations
  const migrationsRun = await runMigrations();
  if (!migrationsRun) {
    log(`\n${colors.red}❌ Cannot proceed without migrations${colors.reset}`, 'red');
    process.exit(1);
  }
  
  // Seed database
  await seedDatabase();
  
  // Test final connection
  const testPassed = await testDatabaseConnection();
  if (!testPassed) {
    log(`\n${colors.red}❌ Final database test failed${colors.reset}`, 'red');
    process.exit(1);
  }
  
  log(`\n${colors.bright}${colors.green}🎉 Database setup completed successfully!${colors.reset}`, 'green');
  log(`\n${colors.cyan}Next steps:${colors.reset}`, 'cyan');
  log(`1. Start the API server: npm run dev`, 'yellow');
  log(`2. Visit the frontend: http://localhost:3000`, 'yellow');
  log(`3. Test the API: http://localhost:3001/health`, 'yellow');
  log(`\n${colors.magenta}Happy coding! 🚀${colors.reset}`, 'magenta');
}

// Run the setup
if (require.main === module) {
  main().catch(error => {
    log(`\n${colors.red}❌ Setup failed: ${error.message}${colors.reset}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, checkPostgreSQLConnection, createDatabase, runMigrations }; 