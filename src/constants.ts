/**
 * Application-wide constants
 */

/**
 * Default settings for new users
 */
export const DEFAULT_SETTINGS = {
  eventName: 'Photo Booth Event',
  adminEmail: '',
  countdownTime: 3,
  resetTime: 30,
  emailSubject: 'Your Photo Booth Pictures',
  emailTemplate: 'Thank you for using our photo booth! Here\'s your picture.',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'user',
  smtpPassword: 'password',
  companyName: 'Bureau of Internet Culture',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  theme: 'custom',
  backgroundColor: '#FFFFFF',
  borderColor: '#E5E7EB',
  buttonColor: '#3B82F6',
  textColor: '#111827',
  customJourneyEnabled: false,
  splashPageEnabled: false,
  printerEnabled: false,
  filtersEnabled: true,
  aiImageCorrection: false,
  showBoothBossLogo: true,
  captureMode: 'photo',
  photoDevice: 'ipad',
  photoOrientation: 'portrait-standard',
  photoResolution: 'medium',
  photoEffect: 'none',
  videoDevice: 'ipad',
  videoDuration: 10,
  videoOrientation: 'portrait-standard',
  videoResolution: 'medium',
  videoEffect: 'none',
  blobVercelEnabled: true,
  localUploadPath: 'uploads',
  storageProvider: 'auto',
  isDefault: false
}; 