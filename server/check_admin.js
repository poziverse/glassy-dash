const Database = require('./db.js');

async function checkAdminUser() {
  const db = new Database('data.sqlite');
  
  try {
    console.log('\n=== Database Schema Check ===\n');
    
    // Get actual table schema
    const tableInfo = await db.prepare(`
      PRAGMA table_info(users)
    `).all();
    
    console.log('Users table columns:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    console.log();
    
    console.log('=== Checking for Admin User ===\n');
    
    // Query for pozilabadmin or eric@poziverse.com - adjust based on actual columns
    const allUsers = await db.prepare(`
      SELECT * 
      FROM users 
    `).all();
    
    console.log(`Total users in database: ${allUsers.length}\n`);
    
    // Look for admin user
    const adminUser = allUsers.find(user => {
      const username = user.username || user.name || user.user_name;
      const email = user.email || user.user_email;
      return username === 'pozilabadmin' || email === 'eric@poziverse.com';
    });
    
    if (adminUser) {
      console.log('✓ User found:\n');
      console.log('  Full user object:', JSON.stringify(adminUser, null, 2));
      console.log();
    } else {
      console.log('✗ User NOT found\n');
      console.log('No user with username "pozilabadmin" or email "eric@poziverse.com" exists in the database.\n');
    }
    
    // List all users
    console.log('=== All Users in Database ===\n');
    if (allUsers.length > 0) {
      allUsers.forEach((user, index) => {
        console.log(`  User ${index + 1}:`);
        console.log('    ' + JSON.stringify(user, null, 2));
      });
    } else {
      console.log('  No users found in database.\n');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.close();
  }
}

checkAdminUser();