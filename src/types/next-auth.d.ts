// src/types/next-auth.d.ts

// These imports are necessary for type augmentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, { DefaultSession } from "next-auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
  
  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}