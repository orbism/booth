const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRole() {
  try {
    // Update the admin user role to ADMIN
    const result = await prisma.$executeRaw`
      UPDATE User 
      SET role = 'ADMIN' 
      WHERE email = 'orb.ism@gmail.com'
    `;
    
    console.log(`Updated admin user role: ${result} record(s) affected`);
    
    // Verify the update
    const users = await prisma.$queryRaw`
      SELECT id, email, role 
      FROM User 
      WHERE email = 'orb.ism@gmail.com'
    `;
    
    console.log('Updated user:', users);
  } catch (error) {
    console.error('Error updating admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRole(); 