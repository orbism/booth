// src/auth.config.ts

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { prisma } from "./lib/prisma";

async function getUser(email: string) {
  try {
    // Use raw query to get user with role
    const users = await prisma.$queryRaw`
      SELECT id, name, email, emailVerified, image, password, role
      FROM User
      WHERE email = ${email}
    `;
    
    // Raw query returns an array
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    if (!user) return null;
    
    // Fix empty role if needed
    if (!user.role || user.role === '') {
      console.log(`User ${email} has an empty role, updating to 'CUSTOMER'`);
      // Update user with empty role
      await prisma.$executeRaw`
        UPDATE User 
        SET role = 'CUSTOMER' 
        WHERE id = ${user.id} AND (role = '' OR role IS NULL)
      `;
      
      // Set role for this session
      user.role = 'CUSTOMER';
    }
    
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login", // Custom error page that will handle specific error codes
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          
          // Check if email has been verified
          if (!user.emailVerified) {
            throw new Error("EMAIL_NOT_VERIFIED");
          }
          
          const passwordsMatch = await bcryptjs.compare(
            password,
            user.password || ""
          );
          
          if (passwordsMatch) {
            console.log(`User authenticated, role: ${user.role}`);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role || 'CUSTOMER', // Ensure role is never empty
            };
          }
        }
        
        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log('JWT callback - user role:', user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        console.log('Session callback - user role:', token.role);
      }
      return session;
    },
  },
};