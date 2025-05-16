const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoleEnum() {
  try {
    const result = await prisma.$queryRaw`SHOW COLUMNS FROM User LIKE 'role'`;
    console.log('Role column definition:', JSON.stringify(result, null, 2));
    
    // Also check what values currently exist in the database
    const roles = await prisma.$queryRaw`SELECT DISTINCT role FROM User`;
    console.log('Current role values in database:', JSON.stringify(roles, null, 2));
  } catch (error) {
    console.error('Error checking enum:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoleEnum()
  .then(() => console.log('Check complete'))
  .catch(e => console.error('Error in check script:', e)); 