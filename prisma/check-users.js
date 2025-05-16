const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking current users and their roles after migration...');
    
    // Get all users
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role FROM User ORDER BY role
    `;
    
    console.log(`Total users in the database: ${users.length}`);
    
    // Count by role
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const customerCount = users.filter(u => u.role === 'CUSTOMER').length;
    const otherRoleCount = users.filter(u => u.role !== 'ADMIN' && u.role !== 'CUSTOMER').length;
    
    console.log(`Users by role:
- ADMIN: ${adminCount}
- CUSTOMER: ${customerCount}
- Other/Invalid roles: ${otherRoleCount}
`);
    
    // Display all users
    console.log('User details:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.name || '(no name)'}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers()
  .then(() => console.log('Check complete'))
  .catch(e => console.error('Check failed:', e)); 