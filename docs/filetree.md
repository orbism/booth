booth-boss/
├── .github/                                    # GitHub CI/CD configuration
│   └── workflows/                              # GitHub Actions workflows
├── .husky/                                     # Git hooks for code quality
├── public/                                     # Static files
│   ├── fonts/                                  # Custom fonts
│   ├── images/                                 # Static images
│   │   └── templates/                          # Photo booth templates and props
│   ├── locales/                                # i18n translation files
│   ├── sounds/                                 # Sound effects
│   │   ├── beep.mp3                            # Countdown beep
│   │   └── camera-shutter.mp3                  # Camera shutter sound
│   └── uploads/                                # Uploaded photos (local storage)
│       └── journey/                            # Journey image assets
├── prisma/                                     # Database ORM
│   ├── migrations/                             # Database migrations
│       └── manual/                             #
│   │       ├── add_splash_page_fields.sql      # Database migration for splash fields
│   │       ├── add_theme_fields.sql            # Theme fields migrations
│   │       └── add_journey_fields.sql          # Custom journey fields migrations
│   ├── schema.prisma                           # Prisma schema definition
│   └── seed.ts                                 # Database seed script
├── scripts/                                    # Helper scripts
│   ├── migrate-capture-mode.js                 # Script to add capture mode fields to database
│   ├── migrate-theme-fields.js                 # Theme fields migration script
│   ├── seed.js                                 # Simplified seed script
│   ├── setup-env.js                            # Database URL generator
│   └── setupscript.sh                          # Complete setup script
├── src/                                        # Application source code
│   ├── app/                                    # Next.js App Router
│   │   ├── admin/                              # Admin section
│   │   │   ├── page.tsx                        # Admin dashboard
│   │   │   ├── layout.tsx                      # Admin layout with sidebar
│   │   │   ├── analytics/                      # New analytics section
│   │   │   │   └── page.tsx                    # Analytics dashboard
│   │   │   ├── sessions/                       # Sessions management
│   │   │   │   ├── page.tsx                    # Server component for data fetching with simplified props
│   │   │   │   └── SessionsList.tsx            # Client component that handles UI rendering and pagination
│   │   │   ├── settings/                       # Settings management
│   │   │   │   └── page.tsx                    # Settings view page
│   │   │   └── setup/                          # Admin setup management 
│   │   │       └── page.tsx                    # Admin first-time setup page (deprecated - moved to app/setup/page.tsx)
│   │   ├── (auth)/                             # Authentication routes
│   │   │   └── login/                          # Login page
│   │   │       └── page.tsx                    # Login page component
│   │   ├── (booth)/                            # Photo/video booth routes
│   │   ├── api/                                # API routes
│   │   │   ├── admin/                          # Admin-related API endpoints
│   │   │   │   ├── analytics/                  #
│   │   │   │   │   └── dashboard/              #
│   │   │   │   │       └── route.ts            # API endpoint for real-time analytics dashboard
│   │   │   │   ├── check/                      # API to check admin user status
│   │   │   │   │   └── route.ts                # Handler for checking if admin needs setup
│   │   │   │   ├── journeys/                   # 
│   │   │   │   │   └── route.ts                # Journey management endpoint
│   │   │   │   ├── settings/                   # 
│   │   │   │   │   └── route.ts                # Backend settings management route
│   │   │   │   └── setup/                      # API for admin account creation
│   │   │   │       └── route.ts                # Handler for setting admin password
│   │   │   │   └── upload/                     # 
│   │   │   │       └── route.ts                # File upload API endpoint
│   │   │   ├── analytics/                      # Analytics API routes
│   │   │   │   └── track/                      # Analytics tracking endpoint
│   │   │   │       └── route.ts                # Handler for client-side analytics
│   │   │   ├── auth/                           # Authentication API endpoints
│   │   │   │   ├── route.ts                    # General auth API handler
│   │   │   │   ├── [...nextauth]/              # NextAuth.js dynamic route
│   │   │   │   │   └── route.ts                # NextAuth.js handler
│   │   │   │   └── error/                      # Auth error handling
│   │   │   │       └── route.ts                # Handler for auth error redirects
│   │   │   ├── booth/                          # Booth endpoints
│   │   │   │   ├── settings/                   #
│   │   │   │   │   └── route.ts                # Public booth settings API
│   │   │   │   └── capture/                    # Photo capture endpoint
│   │   │   │       └── route.ts                # Photo capture API handler
│   │   │   ├── media/                          # not in use
│   │   │   └── users/                          # not in use
│   │   ├── context/                            # 
│   │   │   ├── ThemeContext.tsx                # Theme context provider
│   │   │   └── ToastContext.tsx                # Toast notifications context provider
│   │   ├── hooks/                              # not in use
│   │   ├── lib/                                # not in use
│   │   ├── login/                              # Admin login
│   │   │   └── page.tsx                        # Admin login page
│   │   ├── setup/                              # Admin setup management 
│   │   │   └── page.tsx                        # Admin first-time setup page
│   │   └── state/                              # not in use
│   │   └── utils/                              # not in use
│   │   ├── error.tsx                           # Error page
│   │   ├── layout.tsx                          # Root layout
│   │   ├── loading.tsx                         # Loading state component
│   │   ├── not-found.tsx                       # 404 page
│   │   └── page.tsx                            # Landing page
│   ├── auth.config.ts                          # NextAuth config
│   ├── auth.ts                                 # NextAuth setup
│   ├── middleware.ts                           # Next.js middleware for auth protection
│   ├── components/                             # React components
│   │   ├── ErrorBoundary.tsx                   # Client-side error boundary component
│   │   ├── analytics/                          # 
│   │   │   ├── AnalyticsDashboard.tsx          # Enhanced analytics dashboard with charts and filters
│   │   │   ├── UserJourneyFunnel.tsx           # Funnel visualization for user journey
│   │   │   ├── ConversionTrendChart.tsx        # Chart for tracking conversion trends
│   │   │   ├── MediaTypeChart.tsx              # Chart for tracking media types (photo || video)
│   │   │   └── ImprovementSuggestions.tsx      # Suggestions based on analytics 
│   │   ├── ui/                                 # Basic UI components (shadcn)
│   │   │   ├── ErrorMessage.tsx                # Reusable error message component
│   │   │   ├── OptimizedImage.tsx              # Reusable data URL handler for images
│   │   │   ├── Toast.tsx                       # Toastified notifications
│   │   │   ├── DateRangePicker.tsx             # Date range selection component
│   │   │   └── Tooltip.tsx                     # Contextual help tooltip component
│   │   ├── journey/                            # Basic UI components (shadcn)
│   │   │   ├── JourneyPageView.tsx             # Individual journey page component
│   │   │   ├── JourneyContainer.tsx            # Journey flow manager
│   │   │   ├── JourneyPreview.tsx              # Interactive journey preview
│   │   │   └── PreviewDeviceFrame.tsx          # Device frame for responsive previews
│   │   ├── booth/                              # Photo booth components
│   │   │   ├── CountdownTimer.tsx              # Countdown component
│   │   │   ├── SplashPage.tsx                  # New splash page component
│   │   │   ├── PhotoBooth.tsx                  # Main booth component
│   │   │   ├── PhotoPreview.tsx                # Photo review component
│   │   │   └── VideoPreview.tsx                # Component for video preview and sending
│   │   ├── forms/                              # Form components
│   │   │   ├── tabs/                           # Tab content
│   │   │   │   ├── GeneralTab.tsx              # Basic booth settings
│   │   │   │   ├── EmailTab.tsx                # Email configuration
│   │   │   │   ├── AppearanceTab.tsx           # Visual customization
│   │   │   │   ├── TemplatesTab.tsx            # Theme selection and user journey
│   │   │   │   ├── CustomJourneyTab.tsx        # Custom user journey editor
│   │   │   │   ├── AdvancedTab.tsx             # Advanced settings and utilities
│   │   │   │   ├── SplashTab.tsx               # Splash page setup
│   │   │   │   ├── PhotoModeSettings.tsx       # Settings for photo mode
│   │   │   │   └── VideoModeSettings.tsx       # Settings for video mode
│   │   │   ├── FileUploadField.tsx             # Reusable file upload component
│   │   │   ├── SettingsForm.tsx                # Backend exposed settings form
│   │   │   └── UserInfoForm.tsx                # User information form
│   │   ├── providers/                          # Client component providers
│   │   │   └── SessionProviderWrapper.tsx      # NextAuth session provider wrapper
│   │   └── layouts/                            # Layout components
│   │       └── BoothLayout.tsx                 # Booth layout wrapper
│   ├── hooks/                                  # Custom React hooks
│   │   └── useCamera.ts                        # Camera access hook
│   ├── lib/                                    # Utility functions and libraries
│   │   ├── admin.ts                            # Admin user utility functions
│   │   ├── analytics.ts                        # Analytics utility functions (deprecated)
│   │   ├── analytics-server.ts                 # Analytics utility functions
│   │   ├── db-url.ts                           # Database URL constructor
│   │   ├── email.ts                            # Email sending utilities
│   │   ├── errors.ts                           # Error handling utilities
│   │   ├── prisma.ts                           # Prisma client setup
│   │   ├── themes.ts                           # Theme configuration utility
│   │   ├── theme-css-injector.ts               # Theme injector to override Tailwind classes
│   │   └── theme-loader.ts                     # Helper for loading theme settings
│   ├── types/                                  # TypeScript type definitions
│   │   ├── journey.ts                          # Journey type definitions
│   │   └── next-auth.d.ts                      # NextAuth type extensions
│   └── middleware.ts                           # Next.js middleware
├── .env.local                                  # Environment variables for Prisma (git-ignored)
├── .env.local                                  # Environment variables for Next.js (git-ignored)
├── .env.sample                                 # Sample environment variables
├── .eslintrc.json                              # ESLint configuration
├── .gitignore                                  # Git ignore file
├── .prettierrc                                 # Prettier configuration
├── next.config.js                              # Next.js configuration
├── package.json                                # NPM dependencies
├── postcss.config.js                           # PostCSS configuration
├── README.md                                   # Project documentation
├── tailwind.config.js                          # Tailwind CSS configuration
└── tsconfig.json                               # TypeScript configuration