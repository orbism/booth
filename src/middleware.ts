// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Get the token from the request
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  
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