#!/bin/bash
# setupscript.sh

# Install dependencies
npm install

# Setup environment
node scripts/setup-env.js

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

echo "Setup complete!"