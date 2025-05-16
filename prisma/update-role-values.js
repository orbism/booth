const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRoleValues() {
  try {
    console.log('Starting database migration from USER to CUSTOMER role...');
    
    // First, check what users have the USER role
    const usersWithUserRole = await prisma.$queryRaw`
      SELECT id, email, role FROM User WHERE role = 'USER'
    `;
    
    console.log(`Found ${usersWithUserRole.length} users with role 'USER':`);
    usersWithUserRole.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Now execute the update
    const updatedCount = await prisma.$executeRaw`
      UPDATE User SET role = 'CUSTOMER' WHERE role = 'USER'
    `;
    
    console.log(`Successfully updated ${updatedCount} users from 'USER' to 'CUSTOMER' role.`);
    
    // Verify the update was successful
    const remainingUserRole = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM User WHERE role = 'USER'
    `;
    
    const remainingCount = remainingUserRole[0].count;
    console.log(`Remaining users with 'USER' role: ${remainingCount}`);
    
    if (remainingCount > 0) {
      console.log('Warning: Some users still have the USER role. The update may not have been complete.');
    } else {
      console.log('All users have been successfully migrated from USER to CUSTOMER role.');
    }
    
    // Check users with CUSTOMER role
    const customersAfterMigration = await prisma.$queryRaw`
      SELECT id, email, role FROM User WHERE role = 'CUSTOMER'
    `;
    
    console.log(`Users with CUSTOMER role after migration: ${customersAfterMigration.length}`);
    customersAfterMigration.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error updating role values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoleValues()
  .then(() => console.log('Migration complete'))
  .catch(e => console.error('Migration failed:', e)); 