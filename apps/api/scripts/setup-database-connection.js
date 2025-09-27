// --- START api/scripts/setup-database-connection.js --- //
// Database connection setup script
// Helps configure PostgreSQL connection for AI-InterviewSpark

const { Pool } = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DatabaseSetup {
  constructor() {
    this.envFile = path.join(__dirname, '../.env');
    this.defaultConfig = {
      host: 'localhost',
      port: 5432,
      database: 'ai_interviewspark',
      username: 'postgres',
      password: 'password',
      ssl: false
    };
  }

  // Test database connection
  async testConnection(config) {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    });

    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      await pool.end();
      return { success: false, message: error.message };
    }
  }

  // Generate database URL
  generateDatabaseURL(config) {
    const sslParam = config.ssl ? '?sslmode=require' : '';
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${sslParam}`;
  }

  // Update .env file with database configuration
  updateEnvFile(config) {
    const databaseURL = this.generateDatabaseURL(config);
    
    // Read existing .env file
    let envContent = '';
    if (fs.existsSync(this.envFile)) {
      envContent = fs.readFileSync(this.envFile, 'utf8');
    }

    // Update or add DATABASE_URL
    const lines = envContent.split('\n');
    let updated = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('DATABASE_URL=')) {
        lines[i] = `DATABASE_URL=${databaseURL}`;
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      lines.push(`DATABASE_URL=${databaseURL}`);
    }

    // Write back to .env file
    fs.writeFileSync(this.envFile, lines.join('\n'));
    
    return databaseURL;
  }

  // Interactive setup
  async interactiveSetup() {
    console.log('🔧 Database Connection Setup for AI-InterviewSpark\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    try {
      console.log('Please provide your PostgreSQL connection details:\n');
      
      const host = await question(`Database host [${this.defaultConfig.host}]: `) || this.defaultConfig.host;
      const port = parseInt(await question(`Database port [${this.defaultConfig.port}]: `) || this.defaultConfig.port);
      const database = await question(`Database name [${this.defaultConfig.database}]: `) || this.defaultConfig.database;
      const username = await question(`Username [${this.defaultConfig.username}]: `) || this.defaultConfig.username;
      const password = await question(`Password [${this.defaultConfig.password}]: `) || this.defaultConfig.password;
      const ssl = (await question(`Use SSL? (y/N): `)).toLowerCase() === 'y';

      const config = { host, port, database, username, password, ssl };
      
      console.log('\n🔍 Testing database connection...');
      const testResult = await this.testConnection(config);
      
      if (testResult.success) {
        console.log('✅ Database connection successful!');
        
        const databaseURL = this.updateEnvFile(config);
        console.log(`📝 Updated .env file with DATABASE_URL`);
        console.log(`🔗 Database URL: ${databaseURL.replace(password, '***')}`);
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('You can now run: npm run db:migrate');
        
      } else {
        console.log('❌ Database connection failed:');
        console.log(`   Error: ${testResult.message}`);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure PostgreSQL is running');
        console.log('2. Check your credentials');
        console.log('3. Verify the database exists');
        console.log('4. Check firewall settings');
      }
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    } finally {
      rl.close();
    }
  }

  // Quick setup with default values
  async quickSetup() {
    console.log('🚀 Quick Database Setup (using default values)\n');
    
    const config = { ...this.defaultConfig };
    
    console.log('🔍 Testing database connection...');
    const testResult = await this.testConnection(config);
    
    if (testResult.success) {
      console.log('✅ Database connection successful!');
      
      const databaseURL = this.updateEnvFile(config);
      console.log(`📝 Updated .env file with DATABASE_URL`);
      console.log(`🔗 Database URL: ${databaseURL.replace(config.password, '***')}`);
      
      console.log('\n🎉 Quick setup completed!');
      return true;
    } else {
      console.log('❌ Database connection failed:');
      console.log(`   Error: ${testResult.message}`);
      console.log('\n💡 Try running the interactive setup:');
      console.log('   node scripts/setup-database-connection.js --interactive');
      return false;
    }
  }
}

// Main execution
async function main() {
  const setup = new DatabaseSetup();
  
  if (process.argv.includes('--interactive')) {
    await setup.interactiveSetup();
  } else {
    await setup.quickSetup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseSetup;
