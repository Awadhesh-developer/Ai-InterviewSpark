// Test script to check database users
import { db } from '../src/database/connection';
import { users } from '../src/database/schema';
import bcrypt from 'bcrypt';

async function testDatabaseUsers() {
  try {
    console.log('🔍 Testing database connection...');
    
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
    existingUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
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
          role: 'admin' as const,
          status: 'active' as const,
          phoneNumber: '+1 (555) 123-4567',
          emailVerified: true
        },
        {
          email: 'expert@interviewspark.com',
          password: await bcrypt.hash('expert123', 10),
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'expert' as const,
          status: 'active' as const,
          phoneNumber: '+1 (555) 234-5678',
          emailVerified: true
        },
        {
          email: 'user@interviewspark.com',
          password: await bcrypt.hash('user123', 10),
          firstName: 'John',
          lastName: 'Doe',
          role: 'job_seeker' as const,
          status: 'active' as const,
          phoneNumber: '+1 (555) 345-6789',
          emailVerified: true
        }
      ];
      
      for (const userData of testUsers) {
        try {
          const [newUser] = await db.insert(users).values(userData).returning();
          console.log(`✅ Created user: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);
        } catch (error: any) {
          console.error(`❌ Failed to create user ${userData.email}:`, error.message);
        }
      }
      
      console.log('\n🎉 Test users created successfully!');
    } else {
      console.log('\n✅ Users already exist in database. No seeding needed.');
    }
    
    // Final count
    const finalUsers = await db.query.users.findMany();
    console.log(`\n📈 Final user count: ${finalUsers.length}`);
    console.log('✅ Database test completed!');
    
    return finalUsers.length;
    
  } catch (error: any) {
    console.error('❌ Error testing database:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run the test
testDatabaseUsers()
  .then((count) => {
    console.log(`\n🎯 Test completed successfully with ${count} users in database`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
