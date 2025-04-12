// scripts/setup-env.js

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Extract database connection details
const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER,
  DB_PASSWORD,
  DB_NAME
} = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Missing database configuration parameters');
  process.exit(1);
}

// Construct the DATABASE_URL
const url = `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// Update or create .env file with DATABASE_URL
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace or add DATABASE_URL
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.*(\r?\n|$)/g, `DATABASE_URL="${url}"$1`);
  } else {
    envContent += `\nDATABASE_URL="${url}"\n`;
  }
} else {
  envContent = `DATABASE_URL="${url}"\n`;
}

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log(`Database URL configured: ${url}`);
console.log('Environment setup complete');