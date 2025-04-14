booth-boss/
├── .github/                          # GitHub CI/CD configuration
│   └── workflows/                    # GitHub Actions workflows
├── .husky/                           # Git hooks for code quality
├── public/                           # Static files
│   ├── fonts/                        # Custom fonts
│   ├── images/                       # Static images
│   │   └── templates/                # Photo booth templates and props
│   ├── locales/                      # i18n translation files
│   ├── sounds/                       # Sound effects
│   │   ├── beep.mp3                  # Countdown beep
│   │   └── camera-shutter.mp3        # Camera shutter sound
│   └── uploads/                      # Uploaded photos (local storage)
├── prisma/                           # Database ORM
│   ├── migrations/                   # Database migrations
│   ├── schema.prisma                 # Prisma schema definition
│   └── seed.ts                       # Database seed script
├── scripts/                          # Helper scripts
│   ├── seed.js                     # Simplified seed script
│   ├── setup-env.js                  # Database URL generator
│   └── setupscript.sh                # Complete setup script
├── src/                              # Application source code
│   ├── app/                          # Next.js App Router
│   │   ├── admin/                    # Admin section
│   │   │   ├── page.tsx              # Admin dashboard
│   │   │   ├── layout.tsx            # Admin layout with sidebar
│   │   │   ├── analytics/               # New analytics section
│   │   │   │   └── page.tsx             # Analytics dashboard
│   │   │   ├── sessions/             # Sessions management
│   │   │   │   └── page.tsx          # All sessions list with pagination
│   │   │   ├── settings/             # Settings management
│   │   │   │   └── page.tsx          # Settings view page
│   │   │   └── setup/                # Admin setup management 
│   │   │       └── page.tsx          # Admin first-time setup page (deprecated - moved to app/setup/page.tsx)
│   │   ├── (auth)/                   # Authentication routes
│   │   │   └── login/                # Login page
│   │   │       └── page.tsx          # Login page component
│   │   ├── (booth)/                  # Photo/video booth routes
│   │   ├── api/                      # API routes
│   │   │   ├── admin/                # Admin-related API endpoints
│   │   │   │   ├── check/            # API to check admin user status
│   │   │   │   │   └── route.ts      # Handler for checking if admin needs setup
│   │   │   │   └── setup/            # API for admin account creation
│   │   │   │       └── route.ts      # Handler for setting admin password
│   │   │   ├── analytics/            # Analytics API routes
│   │   │   │   └── track/            # Analytics tracking endpoint
│   │   │   │       └── route.ts      # Handler for analytics events
│   │   │   ├── auth/                 # Authentication API endpoints
│   │   │   │   ├── route.ts          # General auth API handler
│   │   │   │   ├── [...nextauth]/    # NextAuth.js dynamic route
│   │   │   │   │   └── route.ts      # NextAuth.js handler
│   │   │   │   └── error/            # Auth error handling
│   │   │   │       └── route.ts      # Handler for auth error redirects
│   │   │   ├── booth/                # Booth endpoints
│   │   │   │   └── capture/          # Photo capture endpoint
│   │   │   │       └── route.ts      # Photo capture API handler
│   │   │   ├── media/                # not in use
│   │   │   └── users/                # not in use
│   │   ├── components/               # not in use
│   │   ├── hooks/                    # not in use
│   │   ├── lib/                      # not in use
│   │   ├── login/                    # Admin login
│   │   │   └── page.tsx              # Admin login page
│   │   ├── setup/                    # Admin setup management 
│   │   │   └── page.tsx              # Admin first-time setup page
│   │   └── state/                    # not in use
│   │   └── utils/                    # not in use
│   │   ├── error.tsx                 # Error page
│   │   ├── layout.tsx                # Root layout
│   │   ├── loading.tsx               # Loading state component
│   │   ├── not-found.tsx             # 404 page
│   │   └── page.tsx                  # Landing page
│   ├── auth.config.ts                # NextAuth config
│   ├── auth.ts                       # NextAuth setup
│   ├── middleware.ts                 # Next.js middleware for auth protection
│   ├── components/                   # React components
│   │   ├── ErrorBoundary.tsx         # Client-side error boundary component
│   │   ├── ui/                       # Basic UI components (shadcn)
│   │   │   └── ErrorMessage.tsx      # Reusable error message component
│   │   ├── booth/                    # Photo booth components
│   │   │   ├── CountdownTimer.tsx    # Countdown component
│   │   │   ├── PhotoBooth.tsx        # Main booth component
│   │   │   ├── PhotoPreview.tsx      # Photo review component
│   │   │   └── ...                   # Other booth components
│   │   ├── forms/                    # Form components
│   │   │   └── UserInfoForm.tsx      # User information form
│   │   └── layouts/                  # Layout components
│   │       └── BoothLayout.tsx       # Booth layout wrapper
│   ├── hooks/                        # Custom React hooks
│   │   └── useCamera.ts              # Camera access hook
│   ├── lib/                          # Utility functions and libraries
│   │   ├── admin.ts                  # Admin user utility functions
│   │   ├── analytics.ts              # Analytics utility functions
│   │   ├── db-url.ts                 # Database URL constructor
│   │   ├── email.ts                  # Email sending utilities
│   │   ├── errors.ts                 # Error handling utilities
│   │   └── prisma.ts                 # Prisma client setup
│   ├── types/                        # TypeScript type definitions
│   │   └── next-auth.d.ts            # NextAuth type extensions
│   └── middleware.ts                 # Next.js middleware
├── .env.local                        # Environment variables for Prisma (git-ignored)
├── .env.local                        # Environment variables for Next.js (git-ignored)
├── .env.sample                       # Sample environment variables
├── .eslintrc.json                    # ESLint configuration
├── .gitignore                        # Git ignore file
├── .prettierrc                       # Prettier configuration
├── next.config.js                    # Next.js configuration
├── package.json                      # NPM dependencies
├── postcss.config.js                 # PostCSS configuration
├── README.md                         # Project documentation
├── tailwind.config.js                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration