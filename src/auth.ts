// src/auth.ts

// import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authOptions } from "./auth.config";
import { z } from "zod";
import { prisma } from "./lib/prisma";
import bcryptjs from "bcryptjs";

async function getUser(email: string) {
  try {
    // Get user with role using raw query to ensure we have the role field
    const users = await prisma.$queryRaw`
      SELECT id, name, email, emailVerified, image, password, role
      FROM User
      WHERE email = ${email}
    `;
    
    // Raw query returns an array
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authOptions,
  // Remove the adapter
  // adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
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
          
          // We're assuming the password is properly hashed in the database
          const passwordsMatch = await bcryptjs.compare(
            password,
            user.password || ""
          );
          
          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role || 'CUSTOMER', // Ensure role is included
            };
          }
        }
        
        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});