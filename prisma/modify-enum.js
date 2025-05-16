const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function modifyRoleEnum() {
  try {
    console.log('Starting to modify the role enum definition...');
    
    // First, check the current enum definition
    const columnInfo = await prisma.$queryRaw`SHOW COLUMNS FROM User LIKE 'role'`;
    console.log('Current role column definition:', JSON.stringify(columnInfo, null, 2));
    
    // Modify the enum type
    console.log('Modifying the enum definition from USER to CUSTOMER...');
    await prisma.$executeRaw`
      ALTER TABLE User 
      MODIFY COLUMN role ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER'
    `;
    
    // Verify the change
    const updatedColumnInfo = await prisma.$queryRaw`SHOW COLUMNS FROM User LIKE 'role'`;
    console.log('Updated role column definition:', JSON.stringify(updatedColumnInfo, null, 2));
    
    console.log('Enum modification complete. The role column now uses CUSTOMER instead of USER.');
    
  } catch (error) {
    console.error('Error modifying role enum:', error);
  } finally {
    await prisma.$disconnect();
  }
}

modifyRoleEnum()
  .then(() => console.log('Enum modification complete'))
  .catch(e => console.error('Enum modification failed:', e)); 