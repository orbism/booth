// src/components/forms/SettingsForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemeProvider, ThemeOption, THEMES, ThemeColors } from '@/context/ThemeContext';

// Dashbaord Settings tab components
import GeneralTab from './tabs/GeneralTab';
import EmailTab from './tabs/EmailTab';
import AppearanceTab from './tabs/AppearanceTab';
import TemplatesTab from './tabs/TemplatesTab';
import CustomJourneyTab from './tabs/CustomJourneyTab';
import AdvancedTab from './tabs/AdvancedTab';

type SettingsTab = 'general' | 'email' | 'appearance' | 'templates' | 'advanced' | 'journey';

type SettingsData = {
  id: string;
  eventName: string;
  adminEmail: string;
  countdownTime: number;
  resetTime: number;
  emailSubject: string;
  emailTemplate: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  companyName: string;
  companyLogo: string | null;
  primaryColor: string;
  secondaryColor: string;
  theme: "midnight" | "pastel" | "bw" | "custom";
  backgroundColor: string | null;
  borderColor: string | null; 
  buttonColor: string | null;
  textColor: string | null;
  notes: string | null;
  // Add these new fields
  customJourneyEnabled?: boolean;
  journeyName?: string;
  activeJourneyId?: string;
  journeyPages?: Array<{
      id: string;
      title: string;
      content: string;
      backgroundImage: string | null;
      buttonText: string;
      buttonImage: string | null;
  }>;
};

// Settings schema
const settingsSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  adminEmail: z.string().email("Invalid email address"),
  countdownTime: z.coerce.number().int().min(1).max(10),
  resetTime: z.coerce.number().int().min(10).max(300),
  emailSubject: z.string().min(1, "Email subject is required"),
  emailTemplate: z.string().min(1, "Email template is required"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyLogo: z.string().optional().nullable(),
  theme: z.enum(["midnight", "pastel", "bw", "custom"]).default("custom"),
  journeyName: z.string().default('Default Journey'),
  journeyId: z.string().optional(),
  customJourneyEnabled: z.boolean().default(false),
  journeyPages: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      backgroundImage: z.string().nullable(),
      buttonText: z.string(),
      buttonImage: z.string().nullable()
    })
  ).default([]),
  templateId: z.string().optional(),
  userJourneySteps: z.array(z.string()).default(['info', 'photo', 'preview', 'complete']),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  backgroundColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  borderColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  buttonColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  textColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  notes: z.string().optional().nullable(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialSettings: SettingsData;
  onSubmit: (data: SettingsFormValues) => Promise<void>;
}

export default function SettingsForm({ initialSettings, onSubmit }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors }
  } = useForm<SettingsFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(settingsSchema) as unknown as Resolver<SettingsFormValues, any>,
    defaultValues: {
      eventName: initialSettings.eventName,
      adminEmail: initialSettings.adminEmail,
      countdownTime: initialSettings.countdownTime,
      resetTime: initialSettings.resetTime,
      emailSubject: initialSettings.emailSubject,
      emailTemplate: initialSettings.emailTemplate,
      smtpHost: initialSettings.smtpHost,
      smtpPort: initialSettings.smtpPort,
      smtpUser: initialSettings.smtpUser,
      smtpPassword: initialSettings.smtpPassword,
      companyName: initialSettings.companyName,
      companyLogo: initialSettings.companyLogo || '',
      theme: initialSettings.theme || 'custom',
      primaryColor: initialSettings.primaryColor,
      secondaryColor: initialSettings.secondaryColor,
      backgroundColor: initialSettings.backgroundColor || '#ffffff',
      borderColor: initialSettings.borderColor || '#e5e7eb',
      buttonColor: initialSettings.buttonColor || initialSettings.primaryColor,
      textColor: initialSettings.textColor || '#111827',
      notes: initialSettings.notes || '',
      customJourneyEnabled: initialSettings.customJourneyEnabled || false,
      journeyName: initialSettings.journeyName || 'Default Journey',
      journeyId: initialSettings.activeJourneyId || '',
      journeyPages: initialSettings.journeyPages || [],
    }
  });

  // Watch theme and color values for preview
  const watchTheme = watch('theme');
  const watchPrimaryColor = watch('primaryColor');
  const watchSecondaryColor = watch('secondaryColor');
  const watchBgColor = watch('backgroundColor');
  const watchBorderColor = watch('borderColor');
  const watchButtonColor = watch('buttonColor');
  const watchTextColor = watch('textColor');

  // Apply theme when changed
  const handleThemeChange = (theme: ThemeOption, colors: ThemeColors) => {
    setValue('theme', theme);
    
    if (theme !== 'custom') {
      setValue('primaryColor', colors.primaryColor);
      setValue('secondaryColor', colors.secondaryColor);
      setValue('backgroundColor', colors.backgroundColor);
      setValue('borderColor', colors.borderColor);
      setValue('buttonColor', colors.buttonColor);
      setValue('textColor', colors.textColor);
    }
  };

  useEffect(() => {
    const currentTheme = watch('theme') as ThemeOption;
    if (currentTheme && currentTheme !== 'custom') {
      // Apply theme preset values when theme changes
      const themeColors = THEMES[currentTheme as Exclude<ThemeOption, 'custom'>];
      setValue('primaryColor', themeColors.primaryColor);
      setValue('secondaryColor', themeColors.secondaryColor);
      setValue('backgroundColor', themeColors.backgroundColor);
      setValue('borderColor', themeColors.borderColor);
      setValue('buttonColor', themeColors.buttonColor);
      setValue('textColor', themeColors.textColor);
    }
  }, [watch('theme'), setValue]);

  const handleFormSubmit = async (data: SettingsFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Make sure no null values are sent for optional fields
      const formattedData = {
        ...data,
        backgroundColor: data.backgroundColor || '#ffffff',
        borderColor: data.borderColor || '#e5e7eb',
        buttonColor: data.buttonColor || data.primaryColor,
        textColor: data.textColor || '#111827',
      };
    
      await onSubmit(formattedData);
      
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Settings update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <ThemeProvider
        initialTheme={watchTheme as ThemeOption}
        currentColors={{
          primaryColor: watchPrimaryColor,
          secondaryColor: watchSecondaryColor,
          backgroundColor: watchBgColor || '#ffffff', // Add fallback values
          borderColor: watchBorderColor || '#e5e7eb',
          buttonColor: watchButtonColor || watchPrimaryColor,
          textColor: watchTextColor || '#111827'
        }}
        onThemeChange={handleThemeChange}
      >
        {/* Tab navigation */}
        <div className="flex border-b">
          <button
            type="button"
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'general' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'email' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('email')}
          >
            Email
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'appearance' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'templates' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === 'journey' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('journey')}
          >
            Custom Journey
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'advanced' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          {/* Error and success messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <GeneralTab 
              register={register} 
              watch={watch} 
              setValue={setValue} 
              errors={errors} 
            />
          )}

          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <EmailTab 
              register={register} 
              watch={watch} 
              setValue={setValue} 
              errors={errors} 
            />
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <AppearanceTab 
              register={register} 
              watch={watch} 
              setValue={setValue} 
              errors={errors} 
            />
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <TemplatesTab 
              register={register} 
              watch={watch} 
              setValue={setValue} 
              errors={errors} 
            />
          )}

          {/* User Journey Setup Tab */}
          {activeTab === 'journey' && (
            <CustomJourneyTab 
              register={register} 
              watch={watch} 
              setValue={setValue} 
              errors={errors}
              control={control}
            />
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <AdvancedTab 
              register={register} 
              watch={watch} 
              setValue={setValue} 
              errors={errors}
              initialSettings={initialSettings}
              reset={reset}
            />
          )}

          {/* Form Actions */}
          <div className="pt-6 mt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => reset()}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </ThemeProvider>
    </div>
  );
}