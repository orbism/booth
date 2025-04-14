// src/components/forms/SettingsForm.tsx
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemeColors as ThemeColorsType } from '@/lib/themes';

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
};

// type ThemeColors = {
//     primaryColor: string;
//     secondaryColor: string;
//     backgroundColor: string;
//     borderColor: string;
//     buttonColor: string;
//     textColor: string;
// };

// Define the predefined themes
const THEMES = {
  midnight: {
    primaryColor: '#5b21b6', // purple-800
    secondaryColor: '#7c3aed', // purple-600
    backgroundColor: '#0f172a', // slate-900
    borderColor: '#c026d3', // fuchsia-600
    buttonColor: '#fbbf24', // amber-400
    textColor: '#f8fafc' // slate-50
  },
  pastel: {
    primaryColor: '#60a5fa', // blue-400
    secondaryColor: '#a78bfa', // violet-400
    backgroundColor: '#f0f9ff', // sky-50
    borderColor: '#f9a8d4', // pink-300
    buttonColor: '#34d399', // emerald-400
    textColor: '#1e293b' // slate-800
  },
  bw: {
    primaryColor: '#000000',
    secondaryColor: '#4b5563', // gray-600
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db', // gray-300
    buttonColor: '#111827', // gray-900
    textColor: '#111827' // gray-900
  }
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
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  backgroundColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  borderColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  buttonColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  textColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  notes: z.string().optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;
type SettingsTab = 'general' | 'email' | 'appearance' | 'advanced';

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
    formState: { errors }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      ...initialSettings,
      theme: (initialSettings.theme as any) || 'custom'
    } as any
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
  const handleThemeChange = (theme: "midnight" | "pastel" | "bw" | "custom") => {
    setValue('theme', theme);
    
    if (theme !== 'custom') {
      const themeColors = THEMES[theme];
      setValue('primaryColor', themeColors.primaryColor);
      setValue('secondaryColor', themeColors.secondaryColor);
      setValue('backgroundColor', themeColors.backgroundColor);
      setValue('borderColor', themeColors.borderColor);
      setValue('buttonColor', themeColors.buttonColor);
      setValue('textColor', themeColors.textColor);
    }
  };

  const handleFormSubmit = async (data: SettingsFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      await onSubmit(data);
      
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
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
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
            
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                Event Name
              </label>
              <input
                type="text"
                id="eventName"
                {...register('eventName')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.eventName && (
                <p className="mt-1 text-sm text-red-600">{errors.eventName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="countdownTime" className="block text-sm font-medium text-gray-700">
                  Countdown Time (seconds)
                </label>
                <input
                  type="number"
                  id="countdownTime"
                  min="1"
                  max="10"
                  {...register('countdownTime')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.countdownTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.countdownTime.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="resetTime" className="block text-sm font-medium text-gray-700">
                  Reset Time (seconds)
                </label>
                <input
                  type="number"
                  id="resetTime"
                  min="10"
                  max="300"
                  {...register('resetTime')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.resetTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.resetTime.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                Admin Email
              </label>
              <input
                type="email"
                id="adminEmail"
                {...register('adminEmail')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.adminEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.adminEmail.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700">
                  SMTP Host
                </label>
                <input
                  type="text"
                  id="smtpHost"
                  {...register('smtpHost')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.smtpHost && (
                  <p className="mt-1 text-sm text-red-600">{errors.smtpHost.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">
                  SMTP Port
                </label>
                <input
                  type="number"
                  id="smtpPort"
                  {...register('smtpPort')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.smtpPort && (
                  <p className="mt-1 text-sm text-red-600">{errors.smtpPort.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700">
                  SMTP Username
                </label>
                <input
                  type="text"
                  id="smtpUser"
                  {...register('smtpUser')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.smtpUser && (
                  <p className="mt-1 text-sm text-red-600">{errors.smtpUser.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700">
                  SMTP Password
                </label>
                <input
                  type="password"
                  id="smtpPassword"
                  {...register('smtpPassword')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.smtpPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.smtpPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700">
                Email Subject
              </label>
              <input
                type="text"
                id="emailSubject"
                {...register('emailSubject')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.emailSubject && (
                <p className="mt-1 text-sm text-red-600">{errors.emailSubject.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="emailTemplate" className="block text-sm font-medium text-gray-700">
                Email Template
              </label>
              <textarea
                id="emailTemplate"
                rows={4}
                {...register('emailTemplate')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.emailTemplate && (
                <p className="mt-1 text-sm text-red-600">{errors.emailTemplate.message}</p>
              )}
            </div>

            {/* Email Preview */}
            <div className="mt-6 border rounded-md p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Email Preview</h4>
            <div className="border rounded-md p-4" style={{ 
                backgroundColor: watchTheme === 'custom' ? watchBgColor : THEMES[watchTheme].backgroundColor,
                color: watchTheme === 'custom' ? watchTextColor : THEMES[watchTheme].textColor,
                borderColor: watchTheme === 'custom' ? watchBorderColor : THEMES[watchTheme].borderColor
            }}>
                <div className="text-sm font-medium mb-2" style={{ 
                    backgroundColor: watchTheme === 'custom' 
                        ? watchBgColor 
                        : THEMES[watchTheme as keyof typeof THEMES].backgroundColor,
                    borderColor: watchTheme === 'custom' 
                        ? watchBorderColor 
                        : THEMES[watchTheme as keyof typeof THEMES].borderColor,
                    color: watchTheme === 'custom' 
                        ? watchTextColor 
                        : THEMES[watchTheme as keyof typeof THEMES].textColor
                }}>
                <div className="text-sm">
                    {watch('emailTemplate')}
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-right" style={{
                    borderColor: watchTheme === 'custom' ? watchBorderColor : THEMES[watchTheme].borderColor,
                    color: watchTheme === 'custom' ? watchSecondaryColor : THEMES[watchTheme].secondaryColor
                }}>
                    {watch('companyName')}
                </div>
                </div>
            </div>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Appearance Settings</h3>
            
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                {...register('companyName')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700">
                Company Logo URL
              </label>
              <input
                type="text"
                id="companyLogo"
                {...register('companyLogo')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Enter a URL to your logo image</p>
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                Theme
              </label>
              <select
                id="theme"
                {...register('theme')}
                onChange={(e) => handleThemeChange(e.target.value as "midnight" | "pastel" | "bw" | "custom")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="custom">Custom Colors</option>
                <option value="midnight">Midnight Theme</option>
                <option value="pastel">Pastel Theme</option>
                <option value="bw">Black & White Theme</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                  Primary Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="color"
                    id="primaryColor"
                    {...register('primaryColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={watchTheme !== 'custom'}
                  />
                  <input
                    type="text"
                    value={watchPrimaryColor}
                    onChange={(e) => setValue('primaryColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={watchTheme !== 'custom'}
                  />
                </div>
                {errors.primaryColor && (
                  <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
                  Secondary Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="color"
                    id="secondaryColor"
                    {...register('secondaryColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={watchTheme !== 'custom'}
                  />
                  <input
                    type="text"
                    value={watchSecondaryColor}
                    onChange={(e) => setValue('secondaryColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={watchTheme !== 'custom'}
                  />
                </div>
                {errors.secondaryColor && (
                  <p className="mt-1 text-sm text-red-600">{errors.secondaryColor.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
                  Background Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="color"
                    id="backgroundColor"
                    {...register('backgroundColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={watchTheme !== 'custom'}
                  />
                  <input
                    type="text"
                    value={watchBgColor}
                    onChange={(e) => setValue('backgroundColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={watchTheme !== 'custom'}
                  />
                </div>
                {errors.backgroundColor && (
                  <p className="mt-1 text-sm text-red-600">{errors.backgroundColor.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="borderColor" className="block text-sm font-medium text-gray-700">
                  Border Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="color"
                    id="borderColor"
                    {...register('borderColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={watchTheme !== 'custom'}
                  />
                  <input
                    type="text"
                    value={watchBorderColor}
                    onChange={(e) => setValue('borderColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={watchTheme !== 'custom'}
                  />
                </div>
                {errors.borderColor && (
                  <p className="mt-1 text-sm text-red-600">{errors.borderColor.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="buttonColor" className="block text-sm font-medium text-gray-700">
                  Button Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="color"
                    id="buttonColor"
                    {...register('buttonColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={watchTheme !== 'custom'}
                  />
                  <input
                    type="text"
                    value={watchButtonColor}
                    onChange={(e) => setValue('buttonColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={watchTheme !== 'custom'}
                  />
                </div>
                {errors.buttonColor && (
                  <p className="mt-1 text-sm text-red-600">{errors.buttonColor.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="textColor" className="block text-sm font-medium text-gray-700">
                  Text Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="color"
                    id="textColor"
                    {...register('textColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={watchTheme !== 'custom'}
                  />
                  <input
                    type="text"
                    value={watchTextColor}
                    onChange={(e) => setValue('textColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={watchTheme !== 'custom'}
                  />
                </div>
                {errors.textColor && (
                  <p className="mt-1 text-sm text-red-600">{errors.textColor.message}</p>
                )}
              </div>
            </div>

            {/* Theme Preview */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Theme Preview</h4>
              <div 
                className="border rounded-lg overflow-hidden" 
                style={{ 
                    backgroundColor: watchTheme === 'custom' 
                      ? watchBgColor 
                      : THEMES[watchTheme as keyof typeof THEMES].backgroundColor,
                    borderColor: watchTheme === 'custom' 
                      ? watchBorderColor 
                      : THEMES[watchTheme as keyof typeof THEMES].borderColor,
                    color: watchTheme === 'custom' 
                      ? watchTextColor 
                      : THEMES[watchTheme as keyof typeof THEMES].textColor
                  }}
              >
                <div className="p-4 border-b" style={{ borderColor: watchTheme === 'custom' ? watchBorderColor : THEMES[watchTheme].borderColor }}>
                  <h3 className="font-bold" style={{ color: watchTheme === 'custom' ? watchPrimaryColor : THEMES[watchTheme].primaryColor }}>
                    {watch('companyName')}
                  </h3>
                </div>
                <div className="p-4">
                  <p className="mb-4">This is a preview of your selected theme.</p>
                  <button 
                    type="button" 
                    className="px-4 py-2 rounded font-medium" 
                    style={{ 
                        backgroundColor: watchTheme === 'custom' ? watchBgColor : THEMES[watchTheme as keyof typeof THEMES].backgroundColor,
                        color: watchTheme === 'custom' ? watchTextColor : (watchTheme === 'bw' as any ? '#ffffff' : THEMES[watchTheme as keyof typeof THEMES].textColor)
                    }}
                  >
                    Sample Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
                    
                    <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        rows={6}
                        {...register('notes')}
                        placeholder="Add any additional notes about your booth configuration here"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => reset(initialSettings as any)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Reset to Default
                    </button>
                    </div>
                </div>
                )}

                {/* Form Actions */}
                <div className="pt-6 mt-6 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}