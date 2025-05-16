const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renameUserRole() {
  console.log("Starting migration: Renaming USER role to CUSTOMER");

  try {
    // First, get all users with role = 'USER'
    const users = await prisma.$queryRaw`
      SELECT id, email, role 
      FROM User 
      WHERE role = 'USER'
    `;

    console.log(`Found ${users.length} users with USER role to update`);

    // Log the users that will be updated
    console.log("Users to update:", users);

    // For now, just logging the users we would update
    // We'll actually perform the update after schema migration

    console.log("Migration prepared - will execute after schema is updated");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

renameUserRole()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 