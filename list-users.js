const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    console.log("Listing all users from the database...");
    
    // Get all users with their roles
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role
      FROM User
      ORDER BY createdAt DESC
    `;
    
    console.log(`Found ${users.length} users:`);
    
    // Print each user
    users.forEach(user => {
      console.log(`- ${user.name || 'Unnamed'} (${user.email}): ${user.role || 'No role'} [ID: ${user.id}]`);
    });
    
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers()
  .catch(e => {
    console.error("Fatal error:", e);
    process.exit(1);
  }); 