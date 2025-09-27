// Check database users and add test users if needed
const { db } = require('../src/database/connection');
const { users } = require('../src/database/schema');
const bcrypt = require('bcrypt');
const { eq } = require('drizzle-orm');

async function checkAndSeedUsers() {
  try {
    console.log('🔍 Checking existing users in database...');
    
    // Check existing users
    const existingUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${existingUsers.length} users in database:`);
    existingUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
    });
    
    // If no users exist, create some test users
    if (existingUsers.length === 0) {
      console.log('\n🌱 No users found. Creating test users...');
      
      const testUsers = [
        {
          email: 'admin@interviewspark.com',
          password: await bcrypt.hash('admin123', 10),
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          status: 'active',
          phoneNumber: '+1 (555) 123-4567',
          emailVerified: true
        },
        {
          email: 'expert@interviewspark.com',
          password: await bcrypt.hash('expert123', 10),
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'expert',
          status: 'active',
          phoneNumber: '+1 (555) 234-5678',
          emailVerified: true
        },
        {
          email: 'user@interviewspark.com',
          password: await bcrypt.hash('user123', 10),
          firstName: 'John',
          lastName: 'Doe',
          role: 'job_seeker',
          status: 'active',
          phoneNumber: '+1 (555) 345-6789',
          emailVerified: true
        }
      ];
      
      for (const userData of testUsers) {
        try {
          const [newUser] = await db.insert(users).values(userData).returning();
          console.log(`✅ Created user: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);
        } catch (error) {
          console.error(`❌ Failed to create user ${userData.email}:`, error.message);
        }
      }
      
      console.log('\n🎉 Test users created successfully!');
    } else {
      console.log('\n✅ Users already exist in database. No seeding needed.');
    }
    
    // Final count
    const finalUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });
    
    console.log(`\n📈 Final user count: ${finalUsers.length}`);
    console.log('✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking/seeding users:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run if called directly
if (require.main === module) {
  checkAndSeedUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAndSeedUsers };
