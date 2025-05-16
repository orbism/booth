'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Define the Settings interface based on our Prisma schema
interface Settings {
  id?: string;
  eventName: string;
  countdownTime: number;
  resetTime: number;
  emailSubject: string;
  emailTemplate: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  theme: string;
  splashPageEnabled: boolean;
  splashPageTitle: string;
  splashPageContent: string;
  splashPageButtonText: string;
  captureMode: string;
  showBoothBossLogo: boolean;
  filtersEnabled: boolean;
  enabledFilters: string;
  adminEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  
  // New fields for additional tabs
  // Custom Journey fields
  customJourneyEnabled?: boolean;
  journeyConfig?: any;
  activeJourneyId?: string;
  journeyName?: string;
  
  // Capture Mode fields
  photoDevice?: string;
  photoOrientation?: string;
  photoResolution?: string;
  aiImageCorrection?: boolean;
  printerEnabled?: boolean;
  
  // Video mode settings
  videoDevice?: string;
  videoDuration?: number;
  videoOrientation?: string;
  videoResolution?: string;
  videoEffect?: string;
  
  // Filters/Effects
  photoEffect?: string;
  
  // Storage Settings
  storageProvider?: string;
  blobVercelEnabled?: boolean;
  localUploadPath?: string;
  storageBaseUrl?: string;

  // User Journey Steps
  enablePreviewStep?: boolean;
  enableEffectsStep?: boolean;
  enableSocialStep?: boolean;

  // Theme Settings
  textColor?: string;
  borderColor?: string;
  buttonColor?: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Helper function to get CSS class for filter previews
  const getFilterClass = (filter: string): string => {
    switch(filter) {
      case 'grayscale':
        return 'filter grayscale';
      case 'sepia':
        return 'filter sepia';
      case 'vintage':
        return 'filter sepia brightness-75';
      case 'retro':
        return 'filter sepia hue-rotate-30 saturate-150';
      case 'blackAndWhite':
        return 'filter grayscale contrast-125 brightness-110';
      case 'cool':
        return 'filter hue-rotate-60';
      case 'warm':
        return 'filter hue-rotate-330 saturate-150';
      case 'saturated':
        return 'filter saturate-200';
      case 'desaturated':
        return 'filter saturate-50';
      case 'highContrast':
        return 'filter contrast-150';
      case 'normal':
      default:
        return '';
    }
  };
  
  // Function to check if a feature is available in current subscription
  const isFeatureAvailable = (feature: string): boolean => {
    // In a real implementation, this would check the user's subscription tier from the session data
    // For now, we'll just simulate this behavior
    const premiumFeatures = ['aiImageCorrection', 'printerEnabled', 'premium-filters'];
    const proFeatures = ['customJourneyEnabled', 'video-mode'];
    
    // For demonstration, we'll assume all features are available
    // In a real implementation, you would check the user's subscription from session or API
    return true;
  };
  
  // Helper component for premium features
  const PremiumFeatureTag = ({ feature }: { feature: string }) => {
    const tier = feature.startsWith('premium') ? 'PREMIUM' : 'PRO';
    return (
      <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {tier}
      </span>
    );
  };
  
  // State for settings
  const [settings, setSettings] = useState<Settings>({
    eventName: '',
    countdownTime: 3,
    resetTime: 15,
    emailSubject: '',
    emailTemplate: '',
    companyName: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    backgroundColor: '#FFFFFF',
    theme: 'light',
    splashPageEnabled: true,
    splashPageTitle: '',
    splashPageContent: '',
    splashPageButtonText: '',
    captureMode: 'photo',
    showBoothBossLogo: true,
    filtersEnabled: true,
    enabledFilters: '',
    adminEmail: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    
    // Initialize new fields with defaults
    customJourneyEnabled: false,
    photoDevice: 'ipad',
    photoOrientation: 'portrait-standard',
    photoResolution: 'medium',
    aiImageCorrection: false,
    printerEnabled: false,
    videoDevice: 'ipad',
    videoDuration: 10,
    videoResolution: 'medium',
    photoEffect: 'none',
    videoEffect: 'none',
    storageProvider: 'auto',
    blobVercelEnabled: true,
    localUploadPath: 'uploads',

    // New theme settings
    textColor: '#111827',
    borderColor: '#E5E7EB',
    buttonColor: '#3B82F6',

    // User journey steps
    enablePreviewStep: true,
    enableEffectsStep: false,
    enableSocialStep: false
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Fetch settings on component mount
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    const fetchSettings = async () => {
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        const response = await fetch('/api/user/settings');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setErrorMessage('Failed to load settings. Please try again later.');
        toast.error('Error loading settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [status, router]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
      toast.error('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setSettings({
        ...settings,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === 'number') {
      setSettings({
        ...settings,
        [name]: parseInt(value, 10),
      });
    } else {
      setSettings({
        ...settings,
        [name]: value,
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Booth Settings</h1>
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex flex-wrap space-x-1 rounded-xl bg-blue-100 p-1">
            <Tab className={({ selected }) =>
              `rounded-lg py-2.5 text-sm font-medium leading-5 px-3
               ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
            }>
              General
            </Tab>
            <Tab className={({ selected }) =>
              `rounded-lg py-2.5 text-sm font-medium leading-5 px-3
               ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
            }>
              Email
            </Tab>
            <Tab className={({ selected }) =>
              `rounded-lg py-2.5 text-sm font-medium leading-5 px-3
               ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
            }>
              Splash Page
            </Tab>
            <Tab className={({ selected }) =>
              `rounded-lg py-2.5 text-sm font-medium leading-5 px-3
               ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
            }>
              Appearance
            </Tab>
            <Tab className={({ selected }) =>
              `rounded-lg py-2.5 text-sm font-medium leading-5 px-3
               ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
            }>
              Templates
            </Tab>
            <Tab className={({ selected }) =>
              `rounded-lg py-2.5 text-sm font-medium leading-5 px-3
               ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
            }>
              Custom Journey
            </Tab>
            <Tab className={({ selected }) =>
              `rounded-lg py-2.5 text-sm font-medium leading-5 px-3
               ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
            }>
              Capture Mode
            </Tab>
            <Tab className={({ selected }) =>
              `rounded-lg py-2.5 text-sm font-medium leading-5 px-3
               ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
            }>
              Filters
            </Tab>
          </Tab.List>
          
          <Tab.Panels className="mt-4">
            {/* General Settings */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Event Name
                  </label>
                  <input
                    type="text"
                    name="eventName"
                    value={settings.eventName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={settings.companyName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Countdown Time (seconds)
                  </label>
                  <input
                    type="number"
                    name="countdownTime"
                    min="1"
                    max="10"
                    value={settings.countdownTime}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reset Time (seconds)
                  </label>
                  <input
                    type="number"
                    name="resetTime"
                    min="1"
                    max="60"
                    value={settings.resetTime}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Capture Mode
                  </label>
                  <select
                    name="captureMode"
                    value={settings.captureMode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="photo">Photo Only</option>
                    <option value="video">Video Only</option>
                    <option value="both">Photo & Video</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="showBoothBossLogo"
                    id="showBoothBossLogo"
                    checked={settings.showBoothBossLogo}
                    onChange={(e) => setSettings({...settings, showBoothBossLogo: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showBoothBossLogo" className="ml-2 block text-sm text-gray-700">
                    Show Booth Boss Logo
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="filtersEnabled"
                    id="filtersEnabled"
                    checked={settings.filtersEnabled}
                    onChange={(e) => setSettings({...settings, filtersEnabled: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="filtersEnabled" className="ml-2 block text-sm text-gray-700">
                    Enable Photo Filters
                  </label>
                </div>
                
                {settings.filtersEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Enabled Filters (comma separated)
                    </label>
                    <input
                      type="text"
                      name="enabledFilters"
                      value={settings.enabledFilters}
                      onChange={handleChange}
                      placeholder="grayscale,sepia,vintage"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Email Settings */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={settings.adminEmail}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    name="emailSubject"
                    value={settings.emailSubject}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Subject line for emails sent with photos. You can use {'{{'} eventName {'}}'}  as a placeholder.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Template
                  </label>
                  <textarea
                    name="emailTemplate"
                    value={settings.emailTemplate}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Template for emails. You can use the following placeholders: {'{{'} userName {'}}'}, {'{{'} eventName {'}}'}, {'{{'} photoUrl {'}}'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    name="smtpHost"
                    value={settings.smtpHost}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    name="smtpPort"
                    value={settings.smtpPort}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SMTP User
                  </label>
                  <input
                    type="text"
                    name="smtpUser"
                    value={settings.smtpUser}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    name="smtpPassword"
                    value={settings.smtpPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Tab.Panel>
            
            {/* Splash Page Settings */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="splashPageEnabled"
                    id="splashPageEnabled"
                    checked={settings.splashPageEnabled}
                    onChange={(e) => setSettings({...settings, splashPageEnabled: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="splashPageEnabled" className="ml-2 block text-sm text-gray-700">
                    Enable Splash Page
                  </label>
                </div>
                
                {settings.splashPageEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Splash Page Title
                      </label>
                      <input
                        type="text"
                        name="splashPageTitle"
                        value={settings.splashPageTitle}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Splash Page Content
                      </label>
                      <textarea
                        name="splashPageContent"
                        value={settings.splashPageContent}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Splash Page Button Text
                      </label>
                      <input
                        type="text"
                        name="splashPageButtonText"
                        value={settings.splashPageButtonText}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </Tab.Panel>
            
            {/* Appearance Settings */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Theme
                  </label>
                  <select
                    name="theme"
                    value={settings.theme}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Primary Color
                  </label>
                  <div className="flex items-center mt-1">
                    <input
                      type="color"
                      name="primaryColor"
                      value={settings.primaryColor}
                      onChange={handleChange}
                      className="h-10 w-10 rounded-md border-gray-300"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={settings.primaryColor}
                      onChange={handleChange}
                      className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Secondary Color
                  </label>
                  <div className="flex items-center mt-1">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={settings.secondaryColor}
                      onChange={handleChange}
                      className="h-10 w-10 rounded-md border-gray-300"
                    />
                    <input
                      type="text"
                      name="secondaryColor"
                      value={settings.secondaryColor}
                      onChange={handleChange}
                      className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Background Color
                  </label>
                  <div className="flex items-center mt-1">
                    <input
                      type="color"
                      name="backgroundColor"
                      value={settings.backgroundColor}
                      onChange={handleChange}
                      className="h-10 w-10 rounded-md border-gray-300"
                    />
                    <input
                      type="text"
                      name="backgroundColor"
                      value={settings.backgroundColor}
                      onChange={handleChange}
                      className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Tab.Panel>
            
            {/* Templates Settings - New Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Template Selection</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Midnight Template */}
                  <div 
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                      settings.theme === 'midnight' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
                    } ${settings.customJourneyEnabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => {
                      if (settings.customJourneyEnabled) return;
                      setSettings({
                        ...settings,
                        theme: 'midnight',
                        primaryColor: '#6B46C1',
                        secondaryColor: '#4C1D95',
                        backgroundColor: '#1F2937',
                        textColor: '#F3F4F6'
                      });
                    }}
                  >
                    <div className="p-4" style={{ 
                      backgroundColor: '#1F2937',
                      color: '#F3F4F6'
                    }}>
                      <h4 className="font-semibold mb-2" style={{ color: '#6B46C1' }}>
                        Midnight Theme
                      </h4>
                      <div className="h-20 flex flex-col justify-between">
                        <p className="text-sm">Dark purple theme with vibrant accents</p>
                        <button 
                          className="px-3 py-1 rounded text-sm mt-2 w-24"
                          style={{ 
                            backgroundColor: '#6B46C1',
                            color: '#FFFFFF'
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pastel Template */}
                  <div 
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                      settings.theme === 'pastel' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
                    } ${settings.customJourneyEnabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => {
                      if (settings.customJourneyEnabled) return;
                      setSettings({
                        ...settings,
                        theme: 'pastel',
                        primaryColor: '#F472B6',
                        secondaryColor: '#EC4899',
                        backgroundColor: '#FDF2F8',
                        textColor: '#1F2937'
                      });
                    }}
                  >
                    <div className="p-4" style={{ 
                      backgroundColor: '#FDF2F8',
                      color: '#1F2937'
                    }}>
                      <h4 className="font-semibold mb-2" style={{ color: '#F472B6' }}>
                        Pastel Theme
                      </h4>
                      <div className="h-20 flex flex-col justify-between">
                        <p className="text-sm">Soft pastel colors with gentle styling</p>
                        <button 
                          className="px-3 py-1 rounded text-sm mt-2 w-24"
                          style={{ 
                            backgroundColor: '#F472B6',
                            color: '#FFFFFF'
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Black & White Template */}
                  <div 
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                      settings.theme === 'bw' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
                    } ${settings.customJourneyEnabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => {
                      if (settings.customJourneyEnabled) return;
                      setSettings({
                        ...settings,
                        theme: 'bw',
                        primaryColor: '#000000',
                        secondaryColor: '#4B5563',
                        backgroundColor: '#FFFFFF',
                        textColor: '#111827'
                      });
                    }}
                  >
                    <div className="p-4" style={{ 
                      backgroundColor: '#FFFFFF',
                      color: '#111827'
                    }}>
                      <h4 className="font-semibold mb-2" style={{ color: '#000000' }}>
                        Black & White Theme
                      </h4>
                      <div className="h-20 flex flex-col justify-between">
                        <p className="text-sm">Clean monochromatic design</p>
                        <button 
                          className="px-3 py-1 rounded text-sm mt-2 w-24"
                          style={{ 
                            backgroundColor: '#000000',
                            color: '#FFFFFF'
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Template */}
                  <div 
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                      settings.theme === 'custom' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
                    } ${settings.customJourneyEnabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => {
                      if (settings.customJourneyEnabled) return;
                      setSettings({
                        ...settings,
                        theme: 'custom'
                      });
                    }}
                  >
                    <div className="p-4" style={{ 
                      backgroundColor: settings.backgroundColor || '#FFFFFF',
                      color: settings.textColor || '#111827'
                    }}>
                      <h4 className="font-semibold mb-2" style={{ color: settings.primaryColor }}>
                        Custom Theme
                      </h4>
                      <div className="h-20 flex flex-col justify-between">
                        <p className="text-sm">Define your own custom colors</p>
                        <button 
                          className="px-3 py-1 rounded text-sm mt-2 w-24"
                          style={{ 
                            backgroundColor: settings.primaryColor,
                            color: '#FFFFFF'
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {settings.customJourneyEnabled && (
                  <div className="col-span-full bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                    <p className="text-sm text-yellow-700">
                      <strong>Note:</strong> Template selection is disabled while Custom Journey is enabled. 
                      Please disable Custom Journey in the "Custom Journey" tab to select a theme template.
                    </p>
                  </div>
                )}

                {/* User Journey Configuration Section */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">User Journey</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure the steps that users will go through in your photo booth experience.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="step-info"
                        checked={true}
                        disabled={true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="step-info" className="ml-3 block text-sm font-medium text-gray-700">
                        Information Collection (Required)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="step-photo"
                        checked={true}
                        disabled={true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="step-photo" className="ml-3 block text-sm font-medium text-gray-700">
                        Photo/Video Capture (Required)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="step-preview"
                        checked={settings.enablePreviewStep}
                        onChange={(e) => setSettings({...settings, enablePreviewStep: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="step-preview" className="ml-3 block text-sm font-medium text-gray-700">
                        Preview & Approval
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="step-effects"
                        checked={settings.enableEffectsStep}
                        onChange={(e) => setSettings({...settings, enableEffectsStep: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="step-effects" className="ml-3 block text-sm font-medium text-gray-700">
                        Apply Effects & Filters
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="step-social"
                        checked={settings.enableSocialStep}
                        onChange={(e) => setSettings({...settings, enableSocialStep: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="step-social" className="ml-3 block text-sm font-medium text-gray-700">
                        Social Media Sharing
                      </label>
                    </div>
                  </div>
                </div>

                {/* Live Preview Section */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Live Preview</h4>
                  <div 
                    className="border rounded-lg overflow-hidden shadow-sm" 
                    style={{ 
                      backgroundColor: settings.backgroundColor || '#FFFFFF',
                      color: settings.textColor || '#111827',
                    }}
                  >
                    <div className="p-4 border-b" style={{ borderColor: settings.secondaryColor || '#E5E7EB' }}>
                      <h3 className="text-lg font-medium" style={{ color: settings.primaryColor }}>Event Name</h3>
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Your Name</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border rounded-md" 
                          style={{ borderColor: settings.secondaryColor || '#E5E7EB' }}
                          placeholder="Enter your name"
                          disabled
                        />
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input 
                          type="email" 
                          className="w-full px-3 py-2 border rounded-md" 
                          style={{ borderColor: settings.secondaryColor || '#E5E7EB' }}
                          placeholder="Enter your email"
                          disabled
                        />
                      </div>
                      
                      <button 
                        className="w-full py-2 px-4 rounded-md text-white font-medium"
                        style={{ backgroundColor: settings.primaryColor }}
                        disabled
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
            
            {/* Custom Journey Settings - New Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Custom Journey</h3>
                <p className="text-sm text-gray-500">Create custom user experiences for your booth.</p>
                
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
                  <h4 className="text-base font-medium text-blue-800 mb-4">Enable Custom Journey</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Create a unique experience for your users with a custom journey.
                    When enabled, users will follow your custom flow instead of the default journey.
                  </p>
                  
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, customJourneyEnabled: !settings.customJourneyEnabled})}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings.customJourneyEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className="sr-only">Enable custom journey</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings.customJourneyEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {settings.customJourneyEnabled ? 'Custom Journey Enabled' : 'Custom Journey Disabled'}
                    </span>
                  </div>
                </div>
                
                {settings.customJourneyEnabled && (
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-base font-medium text-gray-800 mb-4">Journey Settings</h4>
                      
                      <div className="mb-4">
                        <label htmlFor="journeyName" className="block text-sm font-medium text-gray-700 mb-1">
                          Journey Name
                        </label>
                        <input
                          type="text"
                          id="journeyName"
                          value={settings.journeyName || 'My Custom Journey'}
                          onChange={(e) => setSettings({...settings, journeyName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              Custom journeys allow you to create a unique experience for your booth users.
                              The custom journey builder lets you design multi-step flows with custom questions, branching logic, and personalized experiences.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Journey Preview</h5>
                      <div className="border border-gray-200 rounded-md p-4 bg-white">
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                            <div className="flex items-center">
                              <div className="bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">1</div>
                              <span className="ml-2 text-sm font-medium">Welcome Screen</span>
                            </div>
                            <button className="text-blue-500 hover:text-blue-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                            <div className="flex items-center">
                              <div className="bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">2</div>
                              <span className="ml-2 text-sm font-medium">User Details</span>
                            </div>
                            <button className="text-blue-500 hover:text-blue-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                          </div>
                          
                          <button 
                            className="w-full py-2 text-center text-blue-600 border border-blue-300 border-dashed rounded-md hover:bg-blue-50"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Step
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50"
                          onClick={() => setSettings({...settings, customJourneyEnabled: false})}
                        >
                          Disable Custom Journey
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700"
                        >
                          Save Journey
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Note:</strong> Advanced journey editing features will be available in the next update.
                            Currently, you can enable/disable the custom journey mode and set basic journey settings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Capture Mode Settings - New Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Capture Mode</h3>
                <p className="text-sm text-gray-500">Configure how photos and videos are captured.</p>
                
                {/* Photo/Video Mode Toggle */}
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
                  <h4 className="text-base font-medium text-blue-800 mb-4">Select Capture Mode</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Choose whether your booth captures photos or videos. Each mode has different settings.
                  </p>
                  
                  <div className="flex justify-center w-full max-w-md mx-auto bg-white p-1 rounded-lg shadow-inner">
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, captureMode: 'photo'})}
                      className={`flex-1 py-3 text-center font-medium rounded-md transition-all ${
                        settings.captureMode === 'photo' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Photo Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, captureMode: 'video'})}
                      className={`flex-1 py-3 text-center font-medium rounded-md transition-all ${
                        settings.captureMode === 'video' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Video Mode
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Photo Device
                  </label>
                  <select
                    name="photoDevice"
                    value={settings.photoDevice || 'ipad'}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="ipad">iPad Camera</option>
                    <option value="iphone">iPhone Camera</option>
                    <option value="webcam">Webcam</option>
                    <option value="dslr">DSLR Camera</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Photo Orientation
                  </label>
                  <select
                    name="photoOrientation"
                    value={settings.photoOrientation || 'portrait-standard'}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="portrait-standard">Portrait (Standard)</option>
                    <option value="portrait-full">Portrait (Full Body)</option>
                    <option value="landscape">Landscape</option>
                    <option value="square">Square</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Photo Resolution
                  </label>
                  <select
                    name="photoResolution"
                    value={settings.photoResolution || 'medium'}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="low">Low (faster)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (slower)</option>
                  </select>
                </div>
                
                {settings.captureMode === 'video' || settings.captureMode === 'both' ? (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Video Settings</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Video Duration (seconds)
                          </label>
                          <input
                            type="number"
                            name="videoDuration"
                            min="5"
                            max="60"
                            value={settings.videoDuration || 10}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Video Device
                          </label>
                          <select
                            name="videoDevice"
                            value={settings.videoDevice || 'ipad'}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="ipad">iPad Camera</option>
                            <option value="iphone">iPhone Camera</option>
                            <option value="webcam">Webcam</option>
                            <option value="dslr">DSLR Camera</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Video Resolution
                          </label>
                          <select
                            name="videoResolution"
                            value={settings.videoResolution || 'medium'}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="low">Low (faster)</option>
                            <option value="medium">Medium</option>
                            <option value="high">High (slower)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aiImageCorrection"
                    name="aiImageCorrection"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={settings.aiImageCorrection || false}
                    onChange={(e) => setSettings({...settings, aiImageCorrection: e.target.checked})}
                  />
                  <label htmlFor="aiImageCorrection" className="ml-2 block text-sm text-gray-700">
                    Enable AI Image Enhancement
                  </label>
                  <PremiumFeatureTag feature="premium" />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="printerEnabled"
                    name="printerEnabled"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={settings.printerEnabled || false}
                    onChange={(e) => setSettings({...settings, printerEnabled: e.target.checked})}
                  />
                  <label htmlFor="printerEnabled" className="ml-2 block text-sm text-gray-700">
                    Enable Printer
                  </label>
                  <PremiumFeatureTag feature="premium" />
                </div>
              </div>
            </Tab.Panel>
            
            {/* Filters Settings - New Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Photo Filters</h3>
                <p className="text-sm text-gray-500">Configure photo filters and effects for your booth.</p>
                
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
                  <h4 className="text-base font-medium text-blue-800 mb-4">Enable Photo Filters</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Allow users to apply filters to their photos for creative effects.
                    When enabled, users will be able to choose from a selection of filters before taking their photo.
                  </p>
                  
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, filtersEnabled: !settings.filtersEnabled})}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings.filtersEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className="sr-only">Enable filters</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings.filtersEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {settings.filtersEnabled ? 'Filters Enabled' : 'Filters Disabled'}
                    </span>
                  </div>
                </div>
                
                {settings.filtersEnabled && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium text-gray-800">Available Filters</h4>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { id: 'normal', name: 'Normal', css: '' },
                          { id: 'sepia', name: 'Sepia', css: 'sepia(100%)' },
                          { id: 'grayscale', name: 'B & W', css: 'grayscale(100%)' },
                          { id: 'saturate', name: 'Vibrant', css: 'saturate(200%)' },
                          { id: 'contrast', name: 'Hi-Con', css: 'contrast(150%)' },
                          { id: 'vintage', name: 'Vintage', css: 'sepia(50%) hue-rotate(-30deg) saturate(140%)' }
                        ].map((filter) => {
                          const isEnabled = filter.id === 'normal' || 
                                          (settings.enabledFilters && settings.enabledFilters.split(',').includes(filter.id));
                          
                          return (
                            <div key={filter.id} className="relative">
                              <label
                                className={`block cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                                  isEnabled
                                    ? 'border-blue-500 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => {
                                  if (filter.id === 'normal') return; // Normal is always enabled
                                  
                                  const enabledArr = settings.enabledFilters ? 
                                    settings.enabledFilters.split(',') : [];
                                  
                                  let newEnabled;
                                  if (enabledArr.includes(filter.id)) {
                                    newEnabled = enabledArr.filter(f => f !== filter.id);
                                  } else {
                                    newEnabled = [...enabledArr, filter.id];
                                  }
                                  
                                  setSettings({
                                    ...settings, 
                                    enabledFilters: newEnabled.join(',')
                                  });
                                }}
                              >
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                  {/* Filter preview image */}
                                  <div 
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ 
                                      backgroundImage: 'url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80)', 
                                      filter: filter.css 
                                    }}
                                  ></div>
                                  
                                  {/* Checkmark for selected filters */}
                                  {isEnabled && (
                                    <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                                      <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="p-2 text-center">
                                  <span className="text-sm font-medium">{filter.name}</span>
                                  {filter.id === 'normal' && <span className="block text-xs text-gray-500">(always enabled)</span>}
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-md font-medium text-gray-800 mb-2">Premium Filters</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { id: 'hue-rotate', name: 'Hue Shift', css: 'hue-rotate(180deg)' },
                            { id: 'blur', name: 'Blur', css: 'blur(2px)' },
                            { id: 'invert', name: 'Invert', css: 'invert(100%)' }
                          ].map((filter) => (
                            <div key={filter.id} className="relative">
                              <div className="block cursor-not-allowed overflow-hidden rounded-lg border-2 border-gray-200 opacity-75">
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                  {/* Filter preview image */}
                                  <div 
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ 
                                      backgroundImage: 'url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80)', 
                                      filter: filter.css 
                                    }}
                                  ></div>
                                  
                                  {/* Premium lock */}
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="p-2 text-center">
                                  <span className="text-sm font-medium">{filter.name}</span>
                                  <span className="block text-xs text-gray-500">Premium Feature</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <p className="mt-2 text-sm text-gray-500">
                        Premium filters are available in the Pro and Premium subscription plans.
                        <a href="/pricing" className="text-blue-600 hover:text-blue-800 ml-1">Upgrade your plan</a>
                      </p>
                    </div>
                    
                    <p className="mt-4 text-sm text-gray-500">
                      The selected filters will be available for users to choose from before taking a photo.
                      Make sure to save settings after making changes.
                    </p>
                  </div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 