/**
 * Settings Factory
 * Utilities for creating, converting and validating settings
 */
import { SettingsInput } from '@/types/settings';
import { Settings, Prisma } from '@prisma/client';
import { ensureBoolean } from './settings-service';

/**
 * Process boolean fields in settings input
 */
export function processInputBooleans(data: SettingsInput): SettingsInput {
  // Create a copy to avoid modifying the input
  const result = { ...data };
  
  // List of boolean fields
  const booleanFields = [
    'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
    'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
    'blobVercelEnabled', 'isDefault'
  ];
  
  // Process each boolean field
  for (const field of booleanFields) {
    if (field in result) {
      const resultAny = result as any;
      resultAny[field] = ensureBoolean(resultAny[field]);
    }
  }
  
  return result;
}

/**
 * Process boolean fields for serialization or display
 */
export function processBooleanFields(settings: Settings | null): Settings | null {
  if (!settings) return null;
  
  // Create a copy to avoid modifying the original
  const result = { ...settings } as any;
  
  // Ensure boolean fields are actual booleans
  const booleanFields = [
    'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
    'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
    'blobVercelEnabled', 'isDefault'
  ];
  
  for (const field of booleanFields) {
    if (field in settings) {
      const settingsAny = settings as any;
      result[field] = ensureBoolean(settingsAny[field]);
    }
  }
  
  return result as Settings;
}

/**
 * Create a Prisma-ready input for creating settings
 */
export function createSettingsInput(data: SettingsInput, userId: string): Prisma.SettingsCreateInput {
  // Process all boolean fields
  const processedData = processInputBooleans(data);
  
  // Create the input with strictly typed fields based on the Prisma schema
  const input: Prisma.SettingsCreateInput = {
    // Connect to user - this format is specific to Prisma relationships
    user: {
      connect: { id: userId }
    },
    
    // Required fields with defaults
    eventName: processedData.eventName || 'My Event',
    adminEmail: processedData.adminEmail || '',
    countdownTime: processedData.countdownTime ?? 3,
    resetTime: processedData.resetTime ?? 60,
    emailSubject: processedData.emailSubject || 'Your Photo Booth Picture',
    emailTemplate: processedData.emailTemplate || 'Thank you for using our photo booth!',
    smtpHost: processedData.smtpHost || 'smtp.example.com',
    smtpPort: processedData.smtpPort ?? 587,
    smtpUser: processedData.smtpUser || 'smtpuser',
    smtpPassword: processedData.smtpPassword || 'smtppassword',
    companyName: processedData.companyName || 'My Company',
    theme: processedData.theme || 'custom',
    primaryColor: processedData.primaryColor || '#3B82F6',
    secondaryColor: processedData.secondaryColor || '#1E40AF',
    
    // Boolean fields with defaults
    customJourneyEnabled: processedData.customJourneyEnabled ?? false,
    splashPageEnabled: processedData.splashPageEnabled ?? true,
    printerEnabled: processedData.printerEnabled ?? false,
    filtersEnabled: processedData.filtersEnabled ?? true,
    aiImageCorrection: processedData.aiImageCorrection ?? false,
    showBoothBossLogo: processedData.showBoothBossLogo ?? true,
    blobVercelEnabled: processedData.blobVercelEnabled ?? true,
    isDefault: processedData.isDefault ?? false,
    
    // String fields with defaults
    captureMode: processedData.captureMode || 'photo',
    photoOrientation: processedData.photoOrientation || 'portrait-standard',
    photoDevice: processedData.photoDevice || 'ipad',
    photoResolution: processedData.photoResolution || 'medium',
    photoEffect: processedData.photoEffect || 'none',
    videoOrientation: processedData.videoOrientation || 'portrait-standard',
    videoDevice: processedData.videoDevice || 'ipad',
    videoResolution: processedData.videoResolution || 'medium',
    videoEffect: processedData.videoEffect || 'none',
    videoDuration: processedData.videoDuration ?? 10,
    storageProvider: processedData.storageProvider || 'auto',
    localUploadPath: processedData.localUploadPath || 'uploads',
    
    // Optional fields
    companyLogo: processedData.companyLogo,
    backgroundColor: processedData.backgroundColor,
    borderColor: processedData.borderColor,
    buttonColor: processedData.buttonColor,
    textColor: processedData.textColor,
    notes: processedData.notes,
    journeyConfig: processedData.journeyConfig ? 
      JSON.stringify(processedData.journeyConfig) : null,
    activeJourneyId: processedData.activeJourneyId,
    splashPageTitle: processedData.splashPageTitle,
    splashPageContent: processedData.splashPageContent,
    splashPageImage: processedData.splashPageImage,
    splashPageButtonText: processedData.splashPageButtonText || 'Start',
    enabledFilters: processedData.enabledFilters,
    storageBaseUrl: processedData.storageBaseUrl,
    customCss: processedData.customCss,
  };
  
  return input;
}

/**
 * Create Prisma input for updating existing settings
 */
export function updateSettingsInput(data: SettingsInput): Prisma.SettingsUpdateInput {
  // Process all boolean fields
  const processedData = processInputBooleans(data);
  
  const input: Prisma.SettingsUpdateInput = {};
  
  // Add only the fields that need updating
  if (processedData.eventName !== undefined) input.eventName = processedData.eventName;
  if (processedData.adminEmail !== undefined) input.adminEmail = processedData.adminEmail;
  if (processedData.countdownTime !== undefined) input.countdownTime = processedData.countdownTime;
  if (processedData.resetTime !== undefined) input.resetTime = processedData.resetTime;
  if (processedData.emailSubject !== undefined) input.emailSubject = processedData.emailSubject;
  if (processedData.emailTemplate !== undefined) input.emailTemplate = processedData.emailTemplate;
  if (processedData.smtpHost !== undefined) input.smtpHost = processedData.smtpHost;
  if (processedData.smtpPort !== undefined) input.smtpPort = processedData.smtpPort;
  if (processedData.smtpUser !== undefined) input.smtpUser = processedData.smtpUser;
  if (processedData.smtpPassword !== undefined) input.smtpPassword = processedData.smtpPassword;
  if (processedData.companyName !== undefined) input.companyName = processedData.companyName;
  if (processedData.companyLogo !== undefined) input.companyLogo = processedData.companyLogo;
  if (processedData.theme !== undefined) input.theme = processedData.theme;
  if (processedData.primaryColor !== undefined) input.primaryColor = processedData.primaryColor;
  if (processedData.secondaryColor !== undefined) input.secondaryColor = processedData.secondaryColor;
  if (processedData.backgroundColor !== undefined) input.backgroundColor = processedData.backgroundColor;
  if (processedData.borderColor !== undefined) input.borderColor = processedData.borderColor;
  if (processedData.buttonColor !== undefined) input.buttonColor = processedData.buttonColor;
  if (processedData.textColor !== undefined) input.textColor = processedData.textColor;
  if (processedData.customJourneyEnabled !== undefined) input.customJourneyEnabled = processedData.customJourneyEnabled;
  if (processedData.journeyConfig !== undefined) input.journeyConfig = processedData.journeyConfig ? 
    JSON.stringify(processedData.journeyConfig) : null;
  if (processedData.activeJourneyId !== undefined) input.activeJourneyId = processedData.activeJourneyId;
  if (processedData.splashPageEnabled !== undefined) input.splashPageEnabled = processedData.splashPageEnabled;
  if (processedData.splashPageTitle !== undefined) input.splashPageTitle = processedData.splashPageTitle;
  if (processedData.splashPageContent !== undefined) input.splashPageContent = processedData.splashPageContent;
  if (processedData.splashPageImage !== undefined) input.splashPageImage = processedData.splashPageImage;
  if (processedData.splashPageButtonText !== undefined) input.splashPageButtonText = processedData.splashPageButtonText;
  if (processedData.captureMode !== undefined) input.captureMode = processedData.captureMode;
  if (processedData.photoOrientation !== undefined) input.photoOrientation = processedData.photoOrientation;
  if (processedData.photoDevice !== undefined) input.photoDevice = processedData.photoDevice;
  if (processedData.photoResolution !== undefined) input.photoResolution = processedData.photoResolution;
  if (processedData.photoEffect !== undefined) input.photoEffect = processedData.photoEffect;
  if (processedData.printerEnabled !== undefined) input.printerEnabled = processedData.printerEnabled;
  if (processedData.aiImageCorrection !== undefined) input.aiImageCorrection = processedData.aiImageCorrection;
  if (processedData.videoOrientation !== undefined) input.videoOrientation = processedData.videoOrientation;
  if (processedData.videoDevice !== undefined) input.videoDevice = processedData.videoDevice;
  if (processedData.videoResolution !== undefined) input.videoResolution = processedData.videoResolution;
  if (processedData.videoEffect !== undefined) input.videoEffect = processedData.videoEffect;
  if (processedData.videoDuration !== undefined) input.videoDuration = processedData.videoDuration;
  if (processedData.filtersEnabled !== undefined) input.filtersEnabled = processedData.filtersEnabled;
  if (processedData.enabledFilters !== undefined) input.enabledFilters = processedData.enabledFilters;
  if (processedData.storageProvider !== undefined) input.storageProvider = processedData.storageProvider;
  if (processedData.blobVercelEnabled !== undefined) input.blobVercelEnabled = processedData.blobVercelEnabled;
  if (processedData.localUploadPath !== undefined) input.localUploadPath = processedData.localUploadPath;
  if (processedData.storageBaseUrl !== undefined) input.storageBaseUrl = processedData.storageBaseUrl;
  if (processedData.showBoothBossLogo !== undefined) input.showBoothBossLogo = processedData.showBoothBossLogo;
  if (processedData.customCss !== undefined) input.customCss = processedData.customCss;
  if (processedData.notes !== undefined) input.notes = processedData.notes;
  if (processedData.isDefault !== undefined) input.isDefault = processedData.isDefault;
  
  return input;
} 