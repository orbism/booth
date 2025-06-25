/**
 * Settings type definitions
 * These types match the Prisma schema structure for consistent type handling
 */

/**
 * Core settings interface that matches the Prisma schema fields
 */
export interface SettingsType {
  id?: string;
  userId?: string;
  
  // General Settings
  eventName: string;
  adminEmail: string;
  countdownTime: number;
  resetTime: number;
  
  // Email Settings
  emailSubject: string;
  emailTemplate: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  
  // Brand Settings
  companyName: string;
  companyLogo?: string | null;
  
  // Theme Settings
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string | null;
  borderColor?: string | null;
  buttonColor?: string | null;
  textColor?: string | null;
  
  // Journey Settings
  customJourneyEnabled: boolean;
  journeyConfig?: any | null;
  activeJourneyId?: string | null;
  
  // Splash Settings
  splashPageEnabled: boolean;
  splashPageTitle?: string | null;
  splashPageContent?: string | null;
  splashPageImage?: string | null;
  splashPageButtonText?: string | null;
  
  // Capture Settings
  captureMode: string;
  
  // Photo Settings
  photoOrientation: string;
  photoDevice: string;
  photoResolution: string;
  photoEffect: string;
  printerEnabled: boolean;
  aiImageCorrection: boolean;
  
  // Video Settings
  videoOrientation: string;
  videoDevice: string;
  videoResolution: string;
  videoEffect: string;
  videoDuration: number;
  
  // Filter Settings  
  filtersEnabled: boolean;
  enabledFilters?: string | null;
  
  // Storage Settings
  storageProvider: string;
  blobVercelEnabled: boolean;
  localUploadPath: string;
  storageBaseUrl?: string | null;
  
  // Misc Settings
  showBoothBossLogo: boolean;
  customCss?: string | null;
  notes?: string | null;
  isDefault: boolean;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Settings input - used for creating or updating settings
 */
export type SettingsInput = Partial<SettingsType>;

/**
 * Journey page type for structured journey data
 */
export interface JourneyPage {
  id: string;
  title: string;
  content: string;
  backgroundImage: string | null;
  buttonText: string;
  buttonImage: string | null;
} 