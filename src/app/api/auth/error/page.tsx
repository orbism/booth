// src/app/api/auth/error/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login with error as query param
    router.push(`/login?error=${error || "unknown"}`);
  }, [error, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      <p className="ml-2">Redirecting...</p>
    </div>
  );
}