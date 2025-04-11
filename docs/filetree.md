# BoothBoss: AI-Powered Event Media Platform Codebase Structure

```
photo-booth-app/
├── .github/                          # GitHub CI/CD configuration
│   └── workflows/                    # GitHub Actions workflows
├── .husky/                           # Git hooks for code quality
├── public/                           # Static files
│   ├── fonts/                        # Custom fonts
│   ├── images/                       # Static images
│   │   └── templates/                # Photo booth templates and props
│   └── locales/                      # i18n translation files
├── prisma/                           # Database ORM
│   ├── migrations/                   # Database migrations
│   └── schema.prisma                 # Prisma schema definition
├── src/                              # Application source code
│   ├── app/                          # Next.js App Router
│   │   ├── (admin)/                  # Admin routes (grouped)
│   │   │   ├── dashboard/            # Admin dashboard
│   │   │   ├── settings/             # System settings
│   │   │   ├── users/                # User management
│   │   │   ├── licenses/             # License management
│   │   │   ├── analytics/            # Usage analytics
│   │   │   ├── white-label/          # White-label configuration
│   │   │   └── ai-models/            # AI model management
│   │   ├── (auth)/                   # Authentication routes
│   │   │   ├── login/                # Login page
│   │   │   ├── register/             # Registration page
│   │   │   └── forgot-password/      # Password recovery
│   │   ├── (booth)/                  # Photo/video booth routes
│   │   │   ├── capture/              # Media capture interface
│   │   │   ├── review/               # Media review
│   │   │   ├── edit/                 # Basic editing
│   │   │   ├── enhance/              # AI enhancement
│   │   │   ├── ar-effects/           # AR effects and filters
│   │   │   ├── games/                # Interactive games
│   │   │   ├── share/                # Sharing options
│   │   │   ├── qr/                   # QR code generation
│   │   │   └── gallery/              # User gallery
│   │   ├── (leaser)/                 # Leaser-specific routes
│   │   │   ├── dashboard/            # Leaser dashboard
│   │   │   ├── settings/             # Booth configuration
│   │   │   ├── events/               # Event management
│   │   │   ├── branding/             # Brand configuration
│   │   │   ├── analytics/            # Event analytics
│   │   │   ├── gamification/         # Leaderboard & contest setup
│   │   │   └── templates/            # Event templates
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── media/                # Media handling endpoints
│   │   │   ├── users/                # User management endpoints
│   │   │   ├── settings/             # Settings endpoints
│   │   │   ├── licenses/             # License management endpoints
│   │   │   ├── webhooks/             # External service webhooks
│   │   │   ├── ai/                   # AI processing endpoints
│   │   │   ├── analytics/            # Analytics data endpoints
│   │   │   ├── share/                # Social sharing endpoints
│   │   │   ├── games/                # Gamification endpoints
│   │   │   └── sdk/                  # SDK access endpoints
│   │   ├── error.tsx                 # Error page
│   │   ├── layout.tsx                # Root layout
│   │   ├── not-found.tsx             # 404 page
│   │   └── page.tsx                  # Landing page
│   ├── components/                   # React components
│   │   ├── ui/                       # Basic UI components (shadcn)
│   │   ├── booth/                    # Photo booth components
│   │   │   ├── camera/               # Camera components
│   │   │   ├── filters/              # Filter components
│   │   │   ├── ai-enhance/           # AI enhancement components
│   │   │   ├── ar/                   # AR effect components
│   │   │   ├── background-removal/   # Background removal
│   │   │   ├── face-tracking/        # Face tracking components
│   │   │   ├── games/                # Interactive game components
│   │   │   ├── countdown/            # Countdown timer
│   │   │   ├── sharing/              # Social sharing components
│   │   │   └── output/               # Output components
│   │   ├── admin/                    # Admin components
│   │   ├── leaser/                   # Leaser components
│   │   ├── forms/                    # Form components
│   │   └── layouts/                  # Layout components
│   ├── config/                       # Application configuration
│   │   ├── hardware/                 # Hardware configurations
│   │   ├── filters/                  # Filter configurations
│   │   └── templates/                # Template configurations
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-camera.ts             # Camera hook
│   │   ├── use-filters.ts            # Filters hook
│   │   ├── use-printer.ts            # Printer hook
│   │   └── use-storage.ts            # Storage hook
│   ├── lib/                          # Utility functions and libraries
│   │   ├── auth/                     # Authentication utilities
│   │   ├── db/                       # Database utilities
│   │   ├── hardware/                 # Hardware detection utilities
│   │   ├── media/                    # Media processing utilities
│   │   ├── ai/                       # AI processing utilities
│   │   ├── ar/                       # AR processing utilities
│   │   ├── storage/                  # Storage utilities
│   │   ├── offline/                  # Offline functionality
│   │   ├── sync/                     # Cloud syncing utilities
│   │   ├── analytics/                # Analytics utilities
│   │   ├── sharing/                  # Social sharing utilities
│   │   ├── games/                    # Game utilities
│   │   ├── licensing/                # License validation utilities
│   │   └── printing/                 # Printing utilities
│   ├── providers/                    # React context providers
│   │   ├── auth-provider.tsx         # Authentication provider
│   │   ├── camera-provider.tsx       # Camera provider
│   │   └── settings-provider.tsx     # Settings provider
│   ├── services/                     # Service integrations
│   │   ├── email/                    # Email service
│   │   ├── storage/                  # Storage service
│   │   ├── payment/                  # Payment service
│   │   └── analytics/                # Analytics service
│   ├── state/                        # State management
│   │   ├── booth/                    # Photo booth state
│   │   ├── settings/                 # Settings state
│   │   └── user/                     # User state
│   ├── types/                        # TypeScript type definitions
│   │   ├── hardware.ts               # Hardware types
│   │   ├── media.ts                  # Media types
│   │   ├── settings.ts               # Settings types
│   │   └── user.ts                   # User types
│   ├── utils/                        # Utility functions
│   │   ├── format.ts                 # Formatting utilities
│   │   ├── validation.ts             # Validation utilities
│   │   └── hardware.ts               # Hardware utilities
│   └── middleware.ts                 # Next.js middleware
├── .env.example                      # Example environment variables
├── .eslintrc.json                    # ESLint configuration
├── .gitignore                        # Git ignore file
├── .prettierrc                       # Prettier configuration
├── jest.config.js                    # Jest configuration
├── next.config.js                    # Next.js configuration
├── package.json                      # NPM dependencies
├── postcss.config.js                 # PostCSS configuration
├── README.md                         # Project documentation
├── tailwind.config.js                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration
```