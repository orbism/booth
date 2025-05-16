const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUserToCustomer() {
  try {
    console.log('Starting full migration from USER to CUSTOMER role...');
    
    // Step 1: Check current database state
    console.log('Step 1: Checking current database state...');
    const columnInfo = await prisma.$queryRaw`SHOW COLUMNS FROM User LIKE 'role'`;
    console.log('Current role column definition:', JSON.stringify(columnInfo, null, 2));
    
    const usersWithUserRole = await prisma.$queryRaw`
      SELECT id, email, role FROM User WHERE role = 'USER'
    `;
    console.log(`Found ${usersWithUserRole.length} users with role 'USER'`);
    
    // Step 2: Update existing USER records to CUSTOMER
    console.log('\nStep 2: Updating existing USER records to CUSTOMER...');
    const updatedCount = await prisma.$executeRaw`
      UPDATE User SET role = 'CUSTOMER' WHERE role = 'USER'
    `;
    console.log(`Updated ${updatedCount} users from 'USER' to 'CUSTOMER'`);
    
    // Step 3: Verify data update was successful
    console.log('\nStep 3: Verifying data update...');
    const remainingUserRole = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM User WHERE role = 'USER'
    `;
    const remainingCount = remainingUserRole[0].count;
    
    if (remainingCount > 0) {
      console.log(`Warning: ${remainingCount} users still have the 'USER' role. Proceeding with caution.`);
    } else {
      console.log('All users successfully updated to CUSTOMER role.');
    }
    
    // Step 4: Modify the enum type definition
    console.log('\nStep 4: Modifying the enum definition...');
    await prisma.$executeRaw`
      ALTER TABLE User 
      MODIFY COLUMN role ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER'
    `;
    
    // Step 5: Verify enum change
    console.log('\nStep 5: Verifying enum change...');
    const updatedColumnInfo = await prisma.$queryRaw`SHOW COLUMNS FROM User LIKE 'role'`;
    console.log('Updated role column definition:', JSON.stringify(updatedColumnInfo, null, 2));
    
    // Step 6: Final check
    console.log('\nStep 6: Performing final check...');
    const customersAfterMigration = await prisma.$queryRaw`
      SELECT id, email, role FROM User WHERE role = 'CUSTOMER'
    `;
    console.log(`Users with CUSTOMER role after migration: ${customersAfterMigration.length}`);
    
    const adminsAfterMigration = await prisma.$queryRaw`
      SELECT id, email, role FROM User WHERE role = 'ADMIN'
    `;
    console.log(`Users with ADMIN role after migration: ${adminsAfterMigration.length}`);
    
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUserToCustomer()
  .then(() => console.log('Migration process complete'))
  .catch(e => console.error('Migration process failed:', e)); 