// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isOnAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isOnAuthRoute = request.nextUrl.pathname.startsWith('/login');
  
  // Redirect unauthenticated users trying to access admin routes to login
  if (isOnAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect authenticated users from login page to admin dashboard
  if (isOnAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};