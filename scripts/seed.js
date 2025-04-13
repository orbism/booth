// scripts/seed.js
require('dotenv').config();
const { execSync } = require('child_process');

try {
  console.log('Running Prisma seed script...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  console.log('Seed completed successfully!');
} catch (error) {
  console.error('Error running seed:', error);
  process.exit(1);
}