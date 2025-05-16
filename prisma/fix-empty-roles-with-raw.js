const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmptyRolesWithRaw() {
  console.log("Starting to fix empty roles with raw SQL...");

  try {
    // Find users with empty roles using raw SQL
    const usersWithEmptyRoles = await prisma.$queryRaw`
      SELECT id, email, role 
      FROM User 
      WHERE role = '' OR role IS NULL
    `;

    console.log(`Found ${usersWithEmptyRoles.length} users with empty roles:`);
    console.log(usersWithEmptyRoles);

    if (usersWithEmptyRoles.length > 0) {
      // Update users with empty roles to 'USER' using raw SQL
      const updateResult = await prisma.$executeRaw`
        UPDATE User 
        SET role = 'USER' 
        WHERE role = '' OR role IS NULL
      `;

      console.log(`Updated ${updateResult} users with empty roles to 'USER'`);

      // Verify the update
      const remainingEmptyRoles = await prisma.$queryRaw`
        SELECT id, email, role 
        FROM User 
        WHERE role = '' OR role IS NULL
      `;

      console.log(`Remaining users with empty roles: ${remainingEmptyRoles.length}`);
      if (remainingEmptyRoles.length > 0) {
        console.log(remainingEmptyRoles);
      } else {
        console.log("All empty roles have been fixed!");
      }
    } else {
      console.log("No users with empty roles found.");
    }
  } catch (error) {
    console.error("Error fixing empty roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmptyRolesWithRaw()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 