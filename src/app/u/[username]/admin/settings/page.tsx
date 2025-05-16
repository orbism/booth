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
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
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
    localUploadPath: 'uploads'
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
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Templates</h3>
                <p className="text-sm text-gray-500">Configure templates for emails, printouts, and more.</p>
                
                {/* Placeholder for Templates functionality */}
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-700">
                    Template settings will be available soon. These will allow you to customize the look and feel of emails, printouts, and digital assets.
                  </p>
                </div>
              </div>
            </Tab.Panel>
            
            {/* Custom Journey Settings - New Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Custom Journey</h3>
                <p className="text-sm text-gray-500">Create custom user experiences for your booth.</p>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="customJourneyEnabled"
                    name="customJourneyEnabled"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={settings.customJourneyEnabled || false}
                    onChange={(e) => setSettings({...settings, customJourneyEnabled: e.target.checked})}
                  />
                  <label htmlFor="customJourneyEnabled" className="ml-2 block text-sm text-gray-700">
                    Enable Custom Journey
                  </label>
                </div>
                
                {settings.customJourneyEnabled && (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <p className="text-sm text-yellow-700">
                      Custom journey builder will be available soon. This will allow you to create unique user experiences with multiple steps, custom questions, and branching paths.
                    </p>
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Capture Mode Settings - New Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Capture Mode</h3>
                <p className="text-sm text-gray-500">Configure how photos and videos are captured.</p>
                
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
                </div>
              </div>
            </Tab.Panel>
            
            {/* Filters Settings - New Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Photo Filters</h3>
                <p className="text-sm text-gray-500">Configure photo filters and effects for your booth.</p>
                
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
                  <>
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
                      <p className="mt-1 text-sm text-gray-500">
                        Available filters: normal, grayscale, sepia, vintage, retro, blackAndWhite, cool, warm, saturated, desaturated, highContrast
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="col-span-2 md:col-span-1 bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Standard Filters</h4>
                        <div className="flex flex-wrap gap-2">
                          {['normal', 'grayscale', 'sepia', 'vintage', 'retro', 'blackAndWhite'].map(filter => (
                            <div key={filter} className="bg-white border rounded p-2 text-xs">
                              {filter}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="col-span-2 md:col-span-1 bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Premium Filters</h4>
                        <div className="flex flex-wrap gap-2">
                          {['cool', 'warm', 'saturated', 'desaturated', 'highContrast'].map(filter => (
                            <div key={filter} className="bg-white border rounded p-2 text-xs">
                              {filter}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <p className="text-sm text-yellow-700">
                        Premium filters require a subscription upgrade. Contact support for more information.
                      </p>
                    </div>
                  </>
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