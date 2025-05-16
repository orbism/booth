const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmptyRolesIndividually() {
  try {
    // Find users with empty or NULL roles
    const usersWithInvalidRoles = await prisma.$queryRaw`
      SELECT id, email, role 
      FROM User 
      WHERE role = '' OR role IS NULL
    `;
    
    console.log('Users with invalid roles:', usersWithInvalidRoles);
    
    // Update each user individually
    let updatedCount = 0;
    for (const user of usersWithInvalidRoles) {
      console.log(`Attempting to fix user ${user.email} (${user.id})...`);
      
      try {
        // Use Prisma client to update each user
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'CUSTOMER' }
        });
        
        console.log(`Successfully updated ${user.email} to role CUSTOMER`);
        updatedCount++;
      } catch (userError) {
        console.error(`Failed to update user ${user.email}:`, userError);
      }
    }
    
    console.log(`Updated ${updatedCount} out of ${usersWithInvalidRoles.length} users with invalid roles`);
    
    // Verify the fix
    const remainingInvalidRoles = await prisma.$queryRaw`
      SELECT id, email, role 
      FROM User 
      WHERE role = '' OR role IS NULL
    `;
    
    console.log('Remaining users with invalid roles:', remainingInvalidRoles);
    
  } catch (error) {
    console.error('Error in fix process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmptyRolesIndividually(); 