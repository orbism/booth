# BoothBuddy Project File Structure

Renamed from BoothBoss

This document provides an overview of the project's file structure, organized alphabetically for easier navigation.

### Storage System

The storage system uses a provider pattern to support multiple storage backends:

```
src/lib/storage/
├── index.ts          # Main storage module with unified interface
├── settings.ts       # Storage configuration handling
├── local-provider.ts # Local file system storage implementation
└── vercel-provider.ts # Vercel Blob storage implementation
```

**Key Components:**

- `index.ts` - Provides a unified storage interface and auto-selects the appropriate provider
- `settings.ts` - Handles storage configuration through environment variables
- `local-provider.ts` - Implements file operations for local file system storage
- `vercel-provider.ts` - Implements file operations for Vercel Blob storage

**SaaS Subscription System:**

The subscription system provides tiered access and feature management:

```
src/lib/
├── subscription-features.ts  # Subscription tiers, pricing, and feature definitions
├── auth-utils.ts             # Authentication utilities for data ownership and access control
└── email-templates/
    └── welcome.ts            # Welcome email template for new users
```

```
src/components/providers/
└── SubscriptionProvider.tsx  # Context provider for subscription feature access
```

**User-Based Routing System:**

The new user-based routing system implements a multi-tenant architecture with username-specific routes:

```
src/app/u/
├── [username]/                     # Username-specific routes
│   ├── page.tsx                    # User account dashboard
│   ├── admin/                      # User's admin area
│   │   ├── layout.tsx              # Admin layout with sidebar navigation
│   │   ├── page.tsx                # Admin dashboard
│   │   ├── settings/               # User settings page
│   │   │   └── page.tsx            # Settings management for user
│   │   └── [section]/              # Section-specific admin pages
│   │       └── page.tsx            # Section page component
│   ├── change-password/            # Password management
│   │   └── page.tsx                # Change password page
│   ├── settings/                   # Customer-facing settings
│   │   └── page.tsx                # Customer settings management
│   └── layout.tsx                  # User route authentication layout
```

**User Management System:**

The user management system provides role-based access control and multi-tenant data isolation:

```
src/app/api/admin/users/
├── route.ts                     # List and create users
├── [id]/                        # User-specific operations
│   └── route.ts                 # Get, update, delete user
└── sessions/                    # Session management
    ├── [id]/                    # Single session operations
    │   └── route.ts             # Delete/resend for specific session
    └── bulk/                    # Bulk operations
        └── route.ts             # Bulk delete and data wipe
```

```
src/app/api/user/
├── profile/                     # User profile data
│   └── route.ts                 # Current user profile endpoint
└── settings/                    # User settings API
    └── route.ts                 # Get/update user settings
```

**Registration and Verification System:**

The registration system provides user onboarding and verification:

```
src/app/
├── register/                    # User registration
│   └── page.tsx                 # Registration form
├── verify-email/                # Email verification
│   └── page.tsx                 # Verification handler page
├── verify-success/              # Successful verification
│   └── page.tsx                 # Verification success page
├── forbidden/                   # Access denied page
│   └── page.tsx                 # Forbidden access message
└── account-setup/               # Account setup wizard
    └── page.tsx                 # Setup wizard page

src/app/api/
├── auth/
│   ├── register/                # Registration API
│   │   └── route.ts             # User registration endpoint
│   ├── verify-email/            # Email verification API
│   │   └── route.ts             # Verification endpoint
│   └── user/                    # User data API
│       └── route.ts             # Current user data endpoint
├── account-setup/               # Account setup API
│   └── route.ts                 # Setup data endpoint
├── event-urls/                  # Custom URL management
│   └── check/                   # URL availability checking
│       └── route.ts             # URL check endpoint
└── subscription/                # Subscription management
    └── route.ts                 # User subscription data endpoint
```

```
src/components/
├── layouts/
│   └── Navbar.tsx               # Main navigation with user profile
└── onboarding/
    └── AccountSetupWizard.tsx   # Multi-step setup wizard for new users
```

**Custom URL Routing System:**

The custom URL routing system allows for event-specific booth experiences:

```
src/app/
├── e/                           # Custom event URL routes
│   └── [urlPath]/               # Dynamic URL path routes
│       └── page.tsx             # Event-specific booth page
├── admin/                       # Admin section
│   └── event-urls/              # Event URL management
│       └── page.tsx             # Event URL admin interface

src/app/api/admin/
└── event-urls/                  # Event URL API endpoints
    ├── route.ts                 # List, create event URLs
    └── [id]/                    # URL-specific operations
        └── route.ts             # Get, update, delete URLs
```

**Types System:**

```
src/types/
├── journey.ts                   # Journey type definitions
├── event-url.ts                 # EventUrl type definitions
└── next-auth.d.ts               # NextAuth type extensions
```

**Middleware and Authentication:**

```
middleware.ts                    # Next.js middleware for route protection and authentication
src/auth.config.ts               # Authentication configuration settings
src/auth.ts                      # Main authentication setup and utilities
```

## Database Migration Scripts

- `/prisma/update-role-values.js`: Script to update role values in the database from USER to CUSTOMER
- `/scripts/db.js`: Database management utility script
- `/scripts/reset-db.js`: Script to reset the database
- `/scripts/setup-env.js`: Environment setup script

## Components

- `/src/components/admin/eventUrl/`: Components for event URL management in admin interface
- `/src/components/booth/camera/`: Camera components for the photo booth
- `/src/components/ui/forms/`: Reusable form components

## API Endpoints

- `/src/app/api/admin/`: API routes for admin operations
  - `/src/app/api/admin/users/`: User management API endpoints

## User Interface Components

- `/src/app/u/[username]/admin/`: User-specific admin interface components
  - `/src/app/u/[username]/admin/page.tsx`: Main admin dashboard for specific user
  - `/src/app/u/[username]/admin/settings/`: User-specific settings administration
  - `/src/app/u/[username]/admin/event-urls/`: Event URL management for specific user
  - `/src/app/u/[username]/admin/sessions/`: Session management for specific user

## Media Handling

- `/src/lib/media/`: Media processing utilities

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
│   ├── phase3-saas-plan.md                      # SaaS transformation plan
│   ├── pipeline.md                              # Development workflow and pipeline documentation
│   └── web-workers.md                           # Web Workers documentation
├── eslint.config.mjs                            # ESLint configuration module
├── middleware.ts                                # Next.js middleware for route protection
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
│   │       ├── add_subscription_fields.sql      # Database migration for SaaS fields
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
│   │   ├── account-setup/                       # Account setup wizard page
│   │   │   └── page.tsx                         # Setup wizard component
│   │   ├── admin/                               # Admin dashboard pages
│   │   │   ├── analytics/                       # Analytics section
│   │   │   │   └── page.tsx                     # Analytics dashboard
│   │   │   ├── email-preview/                   # Email preview interface
│   │   │   │   └── page.tsx                     # Email preview page
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
│   │   │   └── users/                           # User management interface
│   │   │       ├── page.tsx                     # User listing and management
│   │   │       └── [id]/                        # User details page
│   │   │           └── page.tsx                 # User editing and data management
│   │   ├── api/                                 # API routes
│   │   ├── forbidden/                           # Access denied page
│   │   │   └── page.tsx                         # Forbidden access message
│   │   ├── u/                                   # User-specific routes
│   │   │   └── [username]/                      # Username-specific routes
│   │   │       ├── admin/                       # User's admin area
│   │   │       │   ├── layout.tsx               # Admin layout with sidebar
│   │   │       │   └── page.tsx                 # User admin dashboard
│   │   │       ├── page.tsx                     # User account page
│   │   │       └── layout.tsx                   # User route layout with auth checks
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
│   │   ├── register/                            # User registration
│   │   │   └── page.tsx                         # Registration form
│   │   ├── setup/                               # Admin setup
│   │   │   └── page.tsx                         # First-time setup page
│   │   ├── state/                               # State management (not in use)
│   │   ├── test/                                # Testing pages
│   │   │   └── browser-compatibility/           # Browser tests
│   │   │       └── page.tsx                     # Browser capability test page
│   │   ├── verify-email/                        # Email verification
│   │   │   └── page.tsx                         # Verification handler page
│   │   ├── verify-success/                      # Successful verification
│   │   │   └── page.tsx                         # Verification success page
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
│   │   ├── journey/                             # Journey components
│   │   │   ├── JourneyContainer.tsx             # Journey manager
│   │   │   ├── JourneyPageView.tsx              # Individual page component
│   │   │   ├── JourneyPreview.tsx               # Interactive preview
│   │   │   └── PreviewDeviceFrame.tsx           # Device frame
│   │   ├── layouts/                             # Layout components
│   │   │   ├── BoothLayout.tsx                  # Booth layout wrapper
│   │   │   └── Navbar.tsx                       # Main navigation with user profile
│   │   ├── onboarding/                          # Onboarding components
│   │   │   └── AccountSetupWizard.tsx           # Multi-step setup wizard
│   │   ├── providers/                           # Context providers
│   │   │   ├── SessionProviderWrapper.tsx       # Auth session provider
│   │   │   └── SubscriptionProvider.tsx         # Subscription context provider
│   │   └── ui/                                  # UI components
│   ├── hooks/                                   # Custom React hooks
│   │   └── useCamera.ts                         # Camera access hook
│   ├── lib/                                     # Utility libraries
│   │   ├── admin.ts                             # Admin utilities
│   │   ├── analytics-server.ts                  # Server-side analytics
│   │   ├── analytics.ts                         # Client-side analytics (deprecated)
│   │   ├── auth-check.ts                        # Authentication checking
│   │   ├── auth-utils.ts                        # Authentication utilities for RBAC
│   │   ├── browser-compatibility.ts             # Browser capability detection
│   │   ├── canvas-video-recorder.ts             # Video recording with filters
│   │   ├── db-url.ts                            # Database URL utilities
│   │   ├── email-templates/                     # Email templates
│   │   │   └── welcome.ts                       # Welcome email for new users
│   │   ├── email.ts                             # Email sending utilities
│   │   ├── errors.ts                            # Error handling utilities
│   │   ├── prisma.ts                            # Prisma client setup
│   │   ├── subscription-features.ts             # Subscription tiers and features
│   │   ├── theme-css-injector.ts                # Theme CSS injection
│   │   ├── theme-loader.ts                      # Theme loading utilities
│   │   └── themes.ts                            # Theme definitions
│   ├── middleware.ts                            # Next.js middleware
│   └── types/                                   # TypeScript definitions
│       ├── journey.ts                           # Journey type definitions
│       ├── event-url.ts                         # EventUrl type definitions
│       └── next-auth.d.ts                       # NextAuth type extensions
├── tailwind.config.js                           # Tailwind CSS configuration
├── temp/                                        # Temporary files
├── tsconfig.json                                # TypeScript configuration
└── tsconfig.tsbuildinfo                         # TypeScript build info
```