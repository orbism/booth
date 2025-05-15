// src/app/login/page.tsx 
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// New component to display error messages more consistently
const LoginErrorMessage = ({ message, isVerificationError = false, email = '' }: { message: string, isVerificationError?: boolean, email?: string }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    <div className="flex">
      <div className="py-1">
        <svg className="fill-current h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M10 0a10 10 0 110 20 10 10 0 010-20zm0 18a8 8 0 100-16 8 8 0 000 16zM9 5h2v6H9V5zm0 8h2v2H9v-2z"/>
        </svg>
      </div>
      <div className="flex-1">
        <p>{message}</p>
        {isVerificationError && email && (
          <div className="mt-2">
            <button 
              onClick={() => handleResendVerification(email)}
              className="text-blue-600 underline hover:text-blue-800"
            >
              Resend verification email
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Function to handle resending verification email
async function handleResendVerification(email: string) {
  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Verification email has been sent! Please check your inbox.');
    } else {
      alert(`Failed to resend verification email: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error resending verification:', error);
    alert('Failed to resend verification email. Please try again later.');
  }
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isVerificationError, setIsVerificationError] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Check if admin needs setup
  useEffect(() => {
    // Check URL for setup success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('setup') === 'success') {
      setSetupSuccess(true);
    }
    
    // Check for verification success
    if (urlParams.get('verified') === 'true') {
      setSetupSuccess(true);
      setError('Your email has been verified. You can now log in.');
    }
  
    async function checkAdminSetup() {
      try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();
        
        if (data.needsSetup && data.adminEmail) {
          setNeedsSetup(true);
          setAdminEmail(data.adminEmail);
          // Pre-fill the email field
          setValue("email", data.adminEmail);
        }
      } catch (error) {
        console.error("Failed to check admin setup:", error);
      }
    }
  
    // Check for auth errors passed as query params
    const errorParam = searchParams.get('error');
    if (errorParam) {
      let errorMessage = "Authentication failed";
      const email = searchParams.get('email') || '';
      
      // Map NextAuth error codes to user-friendly messages
      if (errorParam === 'CredentialsSignin') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (errorParam === 'AccessDenied') {
        errorMessage = "You don't have permission to access this page.";
      } else if (errorParam === 'EMAIL_NOT_VERIFIED') {
        errorMessage = "Your email has not been verified. Please check your inbox for the verification link.";
        setIsVerificationError(true);
        if (email) {
          setCurrentEmail(email);
        }
      }
      
      setError(errorMessage);
    }
    
    checkAdminSetup();
  }, [setValue, searchParams]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      setIsVerificationError(false);
      setCurrentEmail(data.email);
      
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        // More detailed error messages based on the error
        if (result.error.includes('CredentialsSignin')) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (result.error.includes('AccessDenied')) {
          setError("You don't have permission to access this page.");
        } else if (result.error.includes('EMAIL_NOT_VERIFIED')) {
          setError("Your email has not been verified. Please check your inbox for the verification link.");
          setIsVerificationError(true);
        } else {
          setError(result.error || "Authentication failed");
        }
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error instanceof Error 
          ? `Login error: ${error.message}` 
          : "An unexpected error occurred during login. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">BoothBoss Admin Login</h1>

        {setupSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>Admin account has been set up successfully. You can now log in.</p>
          </div>
        )}
        
        {error && <LoginErrorMessage 
          message={error} 
          isVerificationError={isVerificationError}
          email={currentEmail}
        />}
        
        {needsSetup && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <p>Admin account needs to be set up with a password.</p>
            <div className="mt-2">
              <Link 
                href="/setup" 
                className="text-blue-600 font-medium hover:underline"
              >
                Complete account setup →
              </Link>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting || needsSetup}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}