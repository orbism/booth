'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Step types
type SetupStep = 'custom-url' | 'branding' | 'complete';

// Form schema for custom URL step
const customUrlSchema = z.object({
  customUrl: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL cannot exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed")
    .refine(val => !val.endsWith('-'), "URL cannot end with a hyphen"),
  eventName: z.string().min(2, "Event name is required"),
});

// Form schema for branding step
const brandingSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color"),
  logoUrl: z.string().optional(),
});

// Combined type for all form data
type SetupFormData = z.infer<typeof customUrlSchema> & z.infer<typeof brandingSchema>;

export default function AccountSetupWizard() {
  const [currentStep, setCurrentStep] = useState<SetupStep>('custom-url');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<SetupFormData>>({});
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, update } = useSession();
  
  // Form for custom URL step
  const customUrlForm = useForm<z.infer<typeof customUrlSchema>>({
    resolver: zodResolver(customUrlSchema),
    defaultValues: {
      customUrl: '',
      eventName: '',
    }
  });
  
  // Form for branding step
  const brandingForm = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      companyName: '',
      primaryColor: '#3B82F6',
      logoUrl: '',
    }
  });
  
  // Handle submission for custom URL step
  const handleCustomUrlSubmit = async (data: z.infer<typeof customUrlSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Check if URL is available
      const response = await fetch(`/api/event-urls/check?url=${data.customUrl}`);
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || 'Failed to check URL availability');
        return;
      }
      
      if (!result.available) {
        setError('This URL is already taken. Please choose another one.');
        return;
      }
      
      // Save data and proceed to next step
      setFormData(prev => ({ ...prev, ...data }));
      setCurrentStep('branding');
    } catch (error) {
      console.error('Error checking URL:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle submission for branding step
  const handleBrandingSubmit = async (data: z.infer<typeof brandingSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Combine all form data
      const completeFormData = { ...formData, ...data };
      
      // Save everything to API
      const response = await fetch('/api/account-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeFormData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || 'Failed to complete account setup');
        return;
      }
      
      // Mark setup as complete and proceed to final step
      setCurrentStep('complete');
      
      // Update session to refresh user data
      await update();
    } catch (error) {
      console.error('Error completing setup:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle completion - redirect to dashboard
  const handleCompletionContinue = () => {
    router.push('/admin/dashboard');
  };
  
  // Render the correct step based on currentStep state
  const renderStep = () => {
    switch (currentStep) {
      case 'custom-url':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Set Up Your Custom URL</h2>
            <p className="text-gray-600">
              Choose a custom URL for your photo booth. This will be the address that guests visit to access your booth.
            </p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={customUrlForm.handleSubmit(handleCustomUrlSubmit)} className="space-y-4">
              <div>
                <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700">
                  Custom URL
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    boothbuddy.com/
                  </span>
                  <input
                    id="customUrl"
                    type="text"
                    {...customUrlForm.register("customUrl")}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your-event-name"
                  />
                </div>
                {customUrlForm.formState.errors.customUrl && (
                  <p className="mt-1 text-sm text-red-600">{customUrlForm.formState.errors.customUrl.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                  Event Name
                </label>
                <input
                  id="eventName"
                  type="text"
                  {...customUrlForm.register("eventName")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Awesome Event"
                />
                {customUrlForm.formState.errors.eventName && (
                  <p className="mt-1 text-sm text-red-600">{customUrlForm.formState.errors.eventName.message}</p>
                )}
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Checking availability..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'branding':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Customize Your Branding</h2>
            <p className="text-gray-600">
              Set up your company details and branding colors to personalize your photo booth experience.
            </p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={brandingForm.handleSubmit(handleBrandingSubmit)} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  {...brandingForm.register("companyName")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Company"
                />
                {brandingForm.formState.errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{brandingForm.formState.errors.companyName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                  Primary Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    id="primaryColor"
                    type="color"
                    {...brandingForm.register("primaryColor")}
                    className="h-10 w-20 p-0 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    {...brandingForm.register("primaryColor")}
                    className="ml-2 block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
                {brandingForm.formState.errors.primaryColor && (
                  <p className="mt-1 text-sm text-red-600">{brandingForm.formState.errors.primaryColor.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                  Logo URL (Optional)
                </label>
                <input
                  id="logoUrl"
                  type="text"
                  {...brandingForm.register("logoUrl")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('custom-url')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Complete Setup"}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold">Setup Complete!</h2>
            
            <p className="text-gray-600">
              Your account has been set up successfully. You're now ready to start using BoothBuddy!
            </p>
            
            <div className="pt-6">
              <button
                onClick={handleCompletionContinue}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center">
            {currentStep === 'complete' ? 'All Done!' : 'Complete Your Account Setup'}
          </h1>
          
          {currentStep !== 'complete' && (
            <div className="flex items-center justify-center mt-4">
              <div className={`flex items-center ${currentStep === 'custom-url' ? 'text-blue-600' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'custom-url' ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  <span className="font-medium">1</span>
                </div>
                <span className="ml-2 text-sm">URL</span>
              </div>
              <div className={`w-8 h-1 ${currentStep === 'custom-url' ? 'bg-gray-200' : 'bg-blue-500'} mx-2`}></div>
              <div className={`flex items-center ${currentStep === 'branding' ? 'text-blue-600' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'branding' ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  <span className="font-medium">2</span>
                </div>
                <span className="ml-2 text-sm">Branding</span>
              </div>
            </div>
          )}
        </div>
        
        {renderStep()}
      </div>
    </div>
  );
} 