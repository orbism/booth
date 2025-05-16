const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRoles() {
  try {
    // Execute raw SQL query to update roles
    const result = await prisma.$executeRaw`UPDATE User SET role = 'CUSTOMER' WHERE role = 'USER'`;
    
    console.log(`Successfully updated ${result} user(s) from role USER to CUSTOMER`);
  } catch (error) {
    console.error('Error updating user roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoles(); 