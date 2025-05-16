const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmptyRoles() {
  try {
    console.log('Fixing users with empty role values...');
    
    // Find users with empty roles
    const usersWithEmptyRoles = await prisma.$queryRaw`
      SELECT id, name, email, role FROM User WHERE role = '' OR role IS NULL
    `;
    
    console.log(`Found ${usersWithEmptyRoles.length} users with empty roles:`);
    usersWithEmptyRoles.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name || '(no name)'}, Role: "${user.role}"`);
    });
    
    // Update users with empty roles to CUSTOMER
    const updatedCount = await prisma.$executeRaw`
      UPDATE User SET role = 'CUSTOMER' WHERE role = '' OR role IS NULL
    `;
    
    console.log(`Updated ${updatedCount} users with empty roles to CUSTOMER role.`);
    
    // Verify the update was successful
    const remainingEmptyRoles = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM User WHERE role = '' OR role IS NULL
    `;
    
    const remainingCount = remainingEmptyRoles[0].count;
    console.log(`Remaining users with empty roles: ${remainingCount}`);
    
    if (remainingCount > 0) {
      console.log('Warning: Some users still have empty roles. The update may not have been complete.');
    } else {
      console.log('All users with empty roles have been successfully updated to CUSTOMER role.');
    }
    
    // Check final user counts
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role FROM User ORDER BY role
    `;
    
    // Count by role
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const customerCount = users.filter(u => u.role === 'CUSTOMER').length;
    const otherRoleCount = users.filter(u => u.role !== 'ADMIN' && u.role !== 'CUSTOMER').length;
    
    console.log(`\nFinal user roles:
- ADMIN: ${adminCount}
- CUSTOMER: ${customerCount}
- Other/Invalid roles: ${otherRoleCount}
`);
    
    // Display all users after fix
    console.log('User details after fix:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.name || '(no name)'}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error fixing empty roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmptyRoles()
  .then(() => console.log('Fix complete'))
  .catch(e => console.error('Fix failed:', e)); 