// src/components/forms/tabs/AdvancedTab.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm'; 
import { useTheme } from "@/context/ThemeContext";

interface AdvancedTabProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
  initialSettings: any; // This should match the type from SettingsForm
  reset: (values: any) => void;
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({
  register,
  watch,
  setValue,
  errors,
  initialSettings,
  reset
}) => {
  const { currentTheme } = useTheme();
  
  // Get current values from form
  const storageProvider = watch('storageProvider');
  const blobVercelEnabled = watch('blobVercelEnabled');
  const localUploadPath = watch('localUploadPath');
  const storageBaseUrl = watch('storageBaseUrl');
  
  // Additional state as needed
  const isVercelEnvironment = process.env.NEXT_PUBLIC_VERCEL_ENV 
    || process.env.VERCEL 
    || Boolean(process.env.VERCEL_URL);
  
  // Function to handle data export
  const handleExportSettings = () => {
    // Create settings object without sensitive data
    const exportableSettings = {
      eventName: watch('eventName'),
      countdownTime: watch('countdownTime'),
      resetTime: watch('resetTime'),
      theme: watch('theme'),
      companyName: watch('companyName'),
      companyLogo: watch('companyLogo'),
      primaryColor: watch('primaryColor'),
      secondaryColor: watch('secondaryColor'),
      backgroundColor: watch('backgroundColor'),
      borderColor: watch('borderColor'),
      buttonColor: watch('buttonColor'),
      textColor: watch('textColor'),
      notes: watch('notes'),
      // Include user journey steps if added to schema
    };
    
    // Convert to JSON and create download
    const dataStr = JSON.stringify(exportableSettings, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    // Create download link and trigger it
    const exportName = `boothboss-settings-${new Date().toISOString().slice(0, 10)}.json`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataUri);
    downloadAnchorNode.setAttribute('download', exportName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  // Function to handle settings import
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files && event.target.files[0];
    
    if (!file) return;
    
    fileReader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedSettings = JSON.parse(content);
        
        // Update form with imported settings
        Object.entries(importedSettings).forEach(([key, value]) => {
          // Type assertion needed for TypeScript
          setValue(key as keyof SettingsFormValues, value as any);
        });
        
        // Show success message or notification
        alert('Settings imported successfully');
      } catch (error) {
        console.error('Error importing settings:', error);
        alert('Failed to import settings. Please check the file format.');
      }
    };
    
    fileReader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Advanced Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure advanced options for your booth application.
        </p>
      </div>

      {/* Storage Configuration Section */}
      <div className="border-b border-gray-200 pb-5">
        <h4 className="text-md font-medium leading-6 text-gray-900">Storage Configuration</h4>
        <p className="mt-1 text-sm text-gray-500 mb-4">
          Storage settings are currently configured through environment variables.
        </p>
        
        {/* Environment Info */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h5 className="text-sm font-medium text-gray-700">Environment Information</h5>
          <p className="mt-1 text-xs text-gray-500">
            Deployment Type: {isVercelEnvironment ? 'Vercel' : 'Local/Other'}
          </p>
          <p className="text-xs text-gray-500">
            Current Storage: {process.env.STORAGE_PROVIDER === 'vercel' 
              ? 'Vercel Blob' 
              : process.env.STORAGE_PROVIDER === 'local' 
                ? 'Local Storage' 
                : isVercelEnvironment && process.env.ENABLE_VERCEL_BLOB !== 'false' 
                  ? 'Vercel Blob (Auto)' 
                  : 'Local Storage (Auto)'}
          </p>
          <p className="text-xs text-gray-500">
            Local Upload Path: {process.env.LOCAL_UPLOAD_PATH || 'uploads'}
          </p>
          {process.env.STORAGE_BASE_URL && (
            <p className="text-xs text-gray-500">
              Storage Base URL: {process.env.STORAGE_BASE_URL}
            </p>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          <p className="mb-2">
            To configure storage settings, update your environment variables:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code>STORAGE_PROVIDER</code>: Set to "auto", "local", or "vercel"</li>
            <li><code>ENABLE_VERCEL_BLOB</code>: Set to "true" or "false"</li>
            <li><code>LOCAL_UPLOAD_PATH</code>: Set the path within the public directory</li>
            <li><code>STORAGE_BASE_URL</code>: Override the base URL for assets (optional)</li>
          </ul>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any notes or reminders here..."
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
        )}
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Import/Export</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleExportSettings}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Settings
          </button>
          
          <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
            </svg>
            Import Settings
            <input
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleImportSettings}
            />
          </label>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Reset Configuration</h4>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => reset({...initialSettings, theme: initialSettings.theme || 'custom'})}
            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset to Default Settings
          </button>
          <p className="text-xs text-gray-500">
            This will reset all settings to their default values. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTab;