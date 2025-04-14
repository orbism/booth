// src/lib/admin.ts
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export async function checkForAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    return false;
  }
  
  const adminUser = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });
  
  return !!adminUser;
}

export async function checkForAdminPassword() {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    return false;
  }
  
  const adminUser = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });
  
  // Return true if admin exists and has a password
  return !!(adminUser?.password);
}

export async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL environment variable is required');
  }
  
  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });
  
  if (existingAdmin) {
    return existingAdmin;
  }
  
  // Create admin user without password if ADMIN_PASSWORD is not provided
  return prisma.user.create({
    data: {
      email: adminEmail,
      name: process.env.ADMIN_NAME || 'Admin User',
      password: process.env.ADMIN_PASSWORD 
        ? await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) 
        : null, // Allow null password
    },
  });
}