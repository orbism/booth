# BoothBuddy Project File Structure

Renamed from BoothBoss

This document provides an overview of the project's file structure, organized alphabetically for easier navigation.

```
booth-boss/                                      # Main project directory
├── .cursor/                                     # Cursor AI editor configuration
├── .env                                         # Environment variables
├── .env.local                                   # Local environment variables
├── .env.sample                                  # Sample environment variables template
├── .eslintrc.json                               # ESLint configuration
├── .git/                                        # Git repository data
├── .gitignore                                   # Git ignore rules
├── .next/                                       # Next.js build output
├── docs/                                        # Documentation files
│   ├── browser-compatibility.md                 # Browser compatibility information
│   ├── ffmpeg-wasm.md                           # FFMPEG WebAssembly documentation
│   ├── filetree.md                              # This file structure document
│   ├── pipeline.md                              # Development workflow and pipeline documentation
│   └── web-workers.md                           # Web Workers documentation
├── eslint.config.mjs                            # ESLint configuration module
├── next-env.d.ts                                # Next.js TypeScript declarations
├── next.config.js                               # Next.js configuration
├── next.config.ts                               # TypeScript version of Next.js config
├── node_modules/                                # External dependencies
├── package-lock.json                            # Dependency lock file
├── package.json                                 # Project metadata and dependencies
├── postcss.config.mjs                           # PostCSS configuration
├── prisma/                                      # Database schema and migrations
│   ├── migrations/                              # Database migrations
│   │   └── manual/                              # Manual database migrations
│   │       ├── add_filters_fields.sql           # Database migration for photo/video filters
│   │       ├── add_journey_fields.sql           # Custom journey fields migrations
│   │       ├── add_splash_page_fields.sql       # Database migration for splash fields
│   │       └── add_theme_fields.sql             # Theme fields migrations
│   ├── schema.prisma                            # Prisma database schema
│   └── seed.ts                                  # Database seeding script
├── public/                                      # Static assets
│   ├── favicon.ico                              # Website favicon
│   ├── fonts/                                   # Web fonts
│   ├── images/                                  # Static images
│   │   └── templates/                           # Photo booth templates and props
│   ├── locales/                                 # i18n translation files
│   ├── sounds/                                  # Sound effects
│   │   ├── beep.mp3                             # Countdown beep
│   │   └── camera-shutter.mp3                   # Camera shutter sound
│   ├── uploads/                                 # Uploaded photos (local storage)
│   │   └── journey/                             # Journey image assets
│   ├── videos/                                  # Processed videos (WebM & MP4)
│   └── workers/                                 # Web workers for client-side processing
├── README.md                                    # Project documentation
├── scripts/                                     # Helper scripts
│   ├── migrate-capture-mode.js                  # Script to add capture mode fields to database
│   ├── migrate-theme-fields.js                  # Theme fields migration script
│   ├── seed.js                                  # Simplified seed script
│   ├── setup-env.js                             # Database URL generator
│   └── setupscript.sh                           # Complete setup script
├── src/                                         # Source code
│   ├── app/                                     # Next.js App Router pages
│   │   ├── (auth)/                              # Authentication routes
│   │   │   └── login/                           # Login page
│   │   │       └── page.tsx                     # Login page component
│   │   ├── (booth)/                             # Photo/video booth routes
│   │   ├── admin/                               # Admin dashboard pages
│   │   │   ├── analytics/                       # Analytics section
│   │   │   │   └── page.tsx                     # Analytics dashboard
│   │   │   ├── layout.tsx                       # Admin layout with sidebar
│   │   │   ├── page.tsx                         # Admin dashboard
│   │   │   ├── sessions/                        # Sessions management
│   │   │   │   ├── page.tsx                     # Server component for data fetching
│   │   │   │   └── SessionsList.tsx             # Client component for UI rendering
│   │   │   ├── settings/                        # Settings management
│   │   │   │   └── page.tsx                     # Settings view page
│   │   │   ├── setup/                           # Admin setup management
│   │   │   │   └── page.tsx                     # Admin first-time setup page (deprecated)
│   │   │   └── test/                            # Admin test endpoints
│   │   │       └── route.ts                     # Test API endpoints for admin
│   │   ├── api/                                 # API routes
│   │   │   ├── admin/                           # Admin-related API endpoints
│   │   │   │   ├── analytics/                   # Analytics API
│   │   │   │   │   └── dashboard/               # 
│   │   │   │   │       └── route.ts             # Analytics dashboard API
│   │   │   │   ├── check/                       # Admin status check
│   │   │   │   │   └── route.ts                 # Admin setup check handler
│   │   │   │   ├── journeys/                    # Journey management
│   │   │   │   │   └── route.ts                 # Journey endpoint
│   │   │   │   ├── sessions/                    # Session management
│   │   │   │   │   └── route.ts                 # Sessions endpoint
│   │   │   │   ├── settings/                    # Settings management
│   │   │   │   │   └── route.ts                 # Settings endpoint
│   │   │   │   ├── setup/                       # Admin account creation
│   │   │   │   │   └── route.ts                 # Setup handler
│   │   │   │   ├── test/                        # Test endpoints
│   │   │   │   │   └── route.ts                 # Test API endpoints
│   │   │   │   └── upload/                      # File uploads
│   │   │   │       └── route.ts                 # Upload endpoint
│   │   │   ├── analytics/                       # Analytics API routes
│   │   │   │   └── track/                       # Analytics tracking
│   │   │   │       └── route.ts                 # Tracking handler
│   │   │   ├── auth/                            # Authentication API
│   │   │   │   ├── [...nextauth]/               # NextAuth.js dynamic route
│   │   │   │   │   └── route.ts                 # NextAuth.js handler
│   │   │   │   ├── error/                       # Auth error handling
│   │   │   │   │   └── route.ts                 # Error redirect handler
│   │   │   │   └── route.ts                     # General auth handler
│   │   │   ├── booth/                           # Booth endpoints
│   │   │   │   ├── capture/                     # Photo/video capture
│   │   │   │   │   └── route.ts                 # Capture handler
│   │   │   │   └── settings/                    # Booth settings
│   │   │   │       └── route.ts                 # Settings API
│   │   │   ├── media/                           # Media endpoints (not in use)
│   │   │   ├── send-video-email/                # Video email endpoint
│   │   │   ├── users/                           # User endpoints (not in use)
│   │   │   └── video/                           # Video processing
│   │   │       └── convert/                     # Video conversion
│   │   │           └── route.ts                 # WebM to MP4 conversion
│   │   ├── context/                             # Context providers
│   │   │   ├── ThemeContext.tsx                 # Theme provider
│   │   │   └── ToastContext.tsx                 # Toast notifications provider
│   │   ├── error.tsx                            # Error page
│   │   ├── hooks/                               # React hooks (not in use)
│   │   ├── layout.tsx                           # Root layout
│   │   ├── lib/                                 # Utilities (not in use)
│   │   ├── loading.tsx                          # Loading state component
│   │   ├── login/                               # Admin login
│   │   │   └── page.tsx                         # Login page
│   │   ├── not-found.tsx                        # 404 page
│   │   ├── page.tsx                             # Landing page
│   │   ├── setup/                               # Admin setup
│   │   │   └── page.tsx                         # First-time setup page
│   │   ├── state/                               # State management (not in use)
│   │   ├── test/                                # Testing pages
│   │   │   └── browser-compatibility/           # Browser tests
│   │   │       └── page.tsx                     # Browser capability test page
│   │   └── utils/                               # Utilities (not in use)
│   ├── auth.config.ts                           # Authentication configuration
│   ├── auth.ts                                  # Authentication utilities
│   ├── components/                              # React components
│   │   ├── analytics/                           # Analytics components
│   │   │   ├── AnalyticsDashboard.tsx           # Analytics dashboard
│   │   │   ├── ConversionTrendChart.tsx         # Conversion trends chart
│   │   │   ├── ImprovementSuggestions.tsx       # Analytics suggestions
│   │   │   ├── MediaTypeChart.tsx               # Media type tracking chart
│   │   │   └── UserJourneyFunnel.tsx            # User journey visualization
│   │   ├── booth/                               # Booth components
│   │   │   ├── CountdownTimer.tsx               # Countdown timer
│   │   │   ├── FiltersSelector.tsx              # Filters UI
│   │   │   ├── PhotoBooth.tsx                   # Main booth component
│   │   │   ├── PhotoPreview.tsx                 # Photo review component
│   │   │   ├── SplashPage.tsx                   # Welcome screen
│   │   │   └── VideoPreview.tsx                 # Video preview component
│   │   ├── ErrorBoundary.tsx                    # Error handling component
│   │   ├── forms/                               # Form components
│   │   │   ├── FileUploadField.tsx              # File upload component
│   │   │   ├── SettingsForm.tsx                 # Settings form
│   │   │   ├── UserInfoForm.tsx                 # User info form
│   │   │   └── tabs/                            # Settings tabs
│   │   │       ├── AdvancedTab.tsx              # Advanced settings
│   │   │       ├── AppearanceTab.tsx            # Visual customization
│   │   │       ├── CustomJourneyTab.tsx         # Journey editor
│   │   │       ├── EmailTab.tsx                 # Email configuration
│   │   │       ├── FiltersTab.tsx               # Filters settings
│   │   │       ├── GeneralTab.tsx               # Basic settings
│   │   │       ├── PhotoModeSettings.tsx        # Photo mode settings
│   │   │       ├── SplashTab.tsx                # Splash page setup
│   │   │       ├── TemplatesTab.tsx             # Theme selection
│   │   │       └── VideoModeSettings.tsx        # Video mode settings
│   │   ├── journey/                             # Journey components
│   │   │   ├── JourneyContainer.tsx             # Journey manager
│   │   │   ├── JourneyPageView.tsx              # Individual page component
│   │   │   ├── JourneyPreview.tsx               # Interactive preview
│   │   │   └── PreviewDeviceFrame.tsx           # Device frame
│   │   ├── layouts/                             # Layout components
│   │   │   └── BoothLayout.tsx                  # Booth layout wrapper
│   │   ├── providers/                           # Context providers
│   │   │   └── SessionProviderWrapper.tsx       # Auth session provider
│   │   └── ui/                                  # UI components
│   │       ├── DateRangePicker.tsx              # Date range selector
│   │       ├── ErrorMessage.tsx                 # Error message component
│   │       ├── OptimizedImage.tsx               # Image handler
│   │       ├── Toast.tsx                        # Toast notifications
│   │       └── Tooltip.tsx                      # Contextual help tooltip
│   ├── hooks/                                   # Custom React hooks
│   │   └── useCamera.ts                         # Camera access hook
│   ├── lib/                                     # Utility libraries
│   │   ├── admin.ts                             # Admin utilities
│   │   ├── analytics-server.ts                  # Server-side analytics
│   │   ├── analytics.ts                         # Client-side analytics (deprecated)
│   │   ├── auth-check.ts                        # Authentication checking
│   │   ├── browser-compatibility.ts             # Browser capability detection
│   │   ├── canvas-video-recorder.ts             # Video recording with filters
│   │   ├── db-url.ts                            # Database URL utilities
│   │   ├── email.ts                             # Email sending utilities
│   │   ├── errors.ts                            # Error handling utilities
│   │   ├── prisma.ts                            # Prisma client setup
│   │   ├── theme-css-injector.ts                # Theme CSS injection
│   │   ├── theme-loader.ts                      # Theme loading utilities
│   │   └── themes.ts                            # Theme definitions
│   ├── middleware.ts                            # Next.js middleware
│   └── types/                                   # TypeScript definitions
│       ├── journey.ts                           # Journey type definitions
│       └── next-auth.d.ts                       # NextAuth type extensions
├── tailwind.config.js                           # Tailwind CSS configuration
├── temp/                                        # Temporary files
├── tsconfig.json                                # TypeScript configuration
└── tsconfig.tsbuildinfo                         # TypeScript build info
```

## Key Directories and Files

### `/src/app`
Contains Next.js App Router pages and API routes. Each folder represents a route with its associated page components.

### `/src/components`
React components organized by function:
- `/booth`:        Core photo/video booth components including the main PhotoBooth.tsx component
- `/forms`:        Form components for data collection
- `/journey`:      Components for the custom user journey feature
- `/ui`:           Reusable UI components like buttons, modals, etc.

### `/src/lib`
Utility functions and specialized libraries:
- `analytics-server.ts`:       Server-side analytics processing
- `analytics.ts`:              Client-side user interaction tracking
- `browser-compatibility.ts`:  Detection of browser capabilities
- `canvas-video-recorder.ts`:  Canvas-based video recording with filters
- `email.ts`:                  Email sending functionality

### `/public`
Static assets and media files:
- `/fonts`:        Web fonts for consistent typography
- `/images`:       Static images used throughout the application
- `/sounds`:       Sound effects for booth experience
- `/videos`:       Processed videos in WebM and MP4 formats
- `/workers`:      Web workers for client-side processing

### `/prisma`
Database schema and migration files:
- `schema.prisma`: Prisma database schema definition
- `seed.ts`:       Script for seeding the database with initial data
- `/migrations`:   Database migration files

### Key Files
- `PhotoBooth.tsx`:            The main component handling photo/video capture with filters
- `canvas-video-recorder.ts`:  Implementation of the canvas-based video recording with filter support
- `browser-compatibility.ts`:  Utility to detect browser capabilities for canvas/video features 