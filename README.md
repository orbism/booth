# BoothBuddy Photo Booth Application

A modern, AI-powered photo booth application built with Next.js TypeScript, and Prisma

## Features

- **Photo Booth Interface**: A sleek, user-friendly photo and video capture interface
- **Admin Dashboard**: Complete control over booth settings, user management, and analytics
- **Email Integration**: Send booth photos directly to user email
- **Analytics**: Track usage patterns and engagement metrics
- **Multi-User Support**: Support for multiple admin/staff accounts
- **Theme Customization**: Customize colors, logos, and branding
- **Custom Event URLs**: Create custom URLs for specific events with tailored settings
- **Video Booth Mode**: Capture short video clips in addition to photos
- **Custom Journey Builder**: Create custom user journeys and questionnaires
- **Subscription Management**: Manage service tiers and user subscriptions
- User-friendly photo capture experience
- Customizable countdown timer
- Email sharing with captured photos
- Admin dashboard for managing settings
- Responsive design for various devices
- Interactive custom user journeys with smooth transitions and animations
- Toast notifications for system feedback
- Support for embedded content in journey pages

### Registration and Onboarding

The application now features a complete registration and onboarding system:

- **User Registration**: Self-service registration with email verification
- **Email Verification**: Secure verification process with token-based authentication
- **Account Setup Wizard**: Multi-step onboarding process for new users
- **Custom URL Selection**: Users can select and verify availability of custom event URLs
- **Welcome Emails**: Automated welcome emails for new users with getting started information
- **Free Trial Provisioning**: Automatic creation of trial subscriptions for new users

### Subscription System

The application includes a tiered subscription model for SaaS functionality:

- **Multiple Subscription Tiers**: Support for various subscription levels (Free Trial, Bronze, Silver, Gold, Platinum)
- **Feature-based Access Control**: Different features available based on subscription tier
- **Usage Limits**: Tier-specific limits for media count, sessions, and other resources
- **Subscription Context**: React context provider for checking feature access across the application
- **Trial Management**: Support for time-limited free trials with upgrade prompts

### User Management System

The application includes a comprehensive user management system with role-based access control:

- **User Roles**: Support for both regular users and admin roles
- **Admin Interface**: Complete management interface for creating, editing, and deleting users
- **Session Management**: View and manage user sessions with email resend functionality
- **Bulk Operations**: Support for bulk deletion of sessions and secure data wiping
- **Data Isolation**: Multi-tenant system with proper data segregation between users

### Email System

- **Configurable Email Templates**: Customize email templates for photo/video sharing
- **Development Mode Preview**: View emails in development without sending them
- **SMTP Configuration**: Set up your own email delivery service
- **Email Resend**: Ability to resend emails for specific photo booth sessions
- **User-Specific Email Settings**: Each user can have their own email configuration (coming soon)

### Storage System

The application supports multiple storage backends:

- **Local Storage**: Store files on local file system (development mode)
- **Vercel Blob Storage**: Store files on Vercel's cloud storage (production mode)
- **Automatic Fallback**: System automatically selects the appropriate storage based on environment
- **Optional Configuration**: Configure storage preferences through environment variables

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **Email**: Nodemailer with DreamHost SMTP
- **Animation**: Framer Motion for smooth transitions

## Prerequisites

- Node.js 18.x or later
- MySQL database
- DreamHost SMTP credentials (or another email provider)

## Getting Started

### 1. Clone the repository

`git clone https://github.com/yourusername/booth-boss.git`
`cd booth-boss`

### 2. Set up environment variables

Copy the sample environment file and update it with your own values:
Copy .env.sample to both .env.local and .env
Edit both files with your database connection details:

#### Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=yourusername
DB_PASSWORD=yourpassword
DB_NAME=boothboss

#### SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=mail@example.com
SMTP_PASS=yoursmtppassword

#### NextAuth Secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

### 3. Setup the application

Run the setup process:
`npm install`
`node scripts/setup-env.js`
`npx prisma db push`
`npx prisma generate`

Or use npm scripts:
`npm install`
`npm run setup`
`npm run db`

#### Database Management

Update Schema: Modify prisma/schema.prisma
Apply Changes: Run `npm run db`
Regenerate Client: Automatically done after push, or run `npx prisma generate`

### 4. Seed the database with initial data

To initialize the database with default settings:
`npm run db:seed`

The seed script will use values from your .env file for SMTP settings if available.

### 5. Start the development server
`npm run dev`

The application will be available at http://localhost:3000 (or next available port)

## Project Structure

`/src/app`: Next.js App Router pages and API routes
`/src/components`: React components organized by function
`/src/hooks`: Custom React hooks
`/src/lib`: Utility functions and libraries
`/prisma`: Database schema and migrations
- `/scripts`: Helper scripts for setup and deployment

## Development Workflow

Learn how to use git and not wreck other people's branches. 
We love a good PR.

## Deployment

Follow these steps to deploy the application:

1. Build the application:
`npm run build`

2. Start the production server:
`npm start`

## SaaS and User Management

The application is designed as a multi-tenant SaaS platform with comprehensive user management:

### Registration and Verification
1. Users can register through the `/register` page
2. A verification email is sent to confirm the user's email address
3. After verification, users complete the account setup process
4. A free trial subscription is automatically provisioned

### Admin Controls
1. Administrators can manage all users through the admin interface
2. View and edit user details including role, subscription, and usage metrics
3. Manage user sessions and send email reminders
4. Perform bulk operations like deletion and data wiping

### Subscription Management
1. Users are assigned to subscription tiers with different feature sets
2. The system enforces tier-based limits and access controls
3. Upgrade paths are available for users to enhance their subscription
4. Usage metrics are tracked against tier limits

## Admin Setup

The application includes functionality for secure admin account setup:

1. Set `ADMIN_EMAIL` in your `.env` file to specify an administrator account
2. Optionally set `ADMIN_PASSWORD` for immediate access, or leave blank to trigger setup flow
3. When no password is set, administrators will be prompted to create one on first login
4. The setup page can only be accessed by users whose email matches the `ADMIN_EMAIL` value

To manually trigger admin setup:
# Add an admin user directly
`npm run db:seed`

## Admin Dashboard

The application includes an admin dashboard for managing booth sessions and settings:

### Features
- Dashboard with recent sessions overview
- Complete session listing with pagination
- Settings management interface
- Secure authentication using NextAuth.js
- User management system with role-based access
- Email verification status monitoring

### Routes
- `/admin` - Main dashboard with recent sessions
- `/admin/sessions` - Complete list of all photo booth sessions
- `/admin/settings` - Booth configuration settings
- `/admin/users` - User management interface

Access to these routes is protected by authentication middleware.

## Custom User Journey

The application includes a powerful Custom User Journey builder for creating personalized photo booth experiences:

### Features
- Visual journey editor with drag-and-drop organization
- Custom text, background images, and button styling
- Support for embedded HTML content including images, videos, and formatted text
- Smooth animated transitions between journey pages
- Up to 8 customizable pages in the journey flow
- Import/export journey configurations for reuse
- Comprehensive navigation with back button support
- Preview mode to visualize the complete journey flow
- Visual feedback with loading indicators and toast notifications

### Configuration
All user journey elements can be configured through the admin dashboard:
1. General settings for basic booth configuration
2. Splash Page tab for welcome screen setup
3. Templates tab for theme selection
4. Custom Journey tab for multi-step experiences
5. Email tab for delivery settings
6. Advanced tab for system configuration

### Technical Details
- Journey configurations are stored as JSON in the database
- Background images are stored in the public uploads directory
- Custom buttons support both text and image modes

### Splash Page
- Optional welcome screen with customizable title, content, background image and button
- Can be enabled/disabled through admin settings
- Provides a branded introduction to the photo booth experience

### User Data Collection
- Customizable form for collecting user name and email
- Required for photo delivery
- Always appears after splash page (if enabled) or as the first screen (if no splash)

### Custom Journey
- Optional multi-step experience between data collection and photo capture
- Create up to 8 custom pages with unique content and styling
- Each page can have custom background images and button designs
- Perfect for event instructions, sponsorship acknowledgments, or thematic content

### Custom Journey Configuration
1. Access the journey builder from the admin dashboard under Settings > Custom Journey
2. Enable custom journey mode with the toggle switch
3. Add pages using the "Add Page" button
4. Customize each page with text, backgrounds, and button properties
5. Reorder pages using the up/down arrows
6. Save configuration when complete

### Photo Capture
- Professional countdown timer with sound effects
- Live preview with optional filters and effects
- Review and retake capabilities
- Automated delivery to user's email

### Photo/Video Filters**
- Apple Photobooth-style filters including Sepia, Black & White, Vibrant, High Contrast, and more
- Live filter preview before capture
- Admin controls for enabling/disabling specific filters
- Filter effects for both photo and video modes


## Analytics Features

The application includes comprehensive analytics tracking for booth sessions:

### User Metrics
- Session tracking with start/completion events
- User interaction events (photo captures, retakes, etc.)
- Completion rates and average session duration
- Email domain analytics (anonymized for privacy)

### Admin Dashboard
- Real-time analytics overview on the main dashboard
- Dedicated analytics page with daily/weekly/monthly metrics
- Recent events log for detailed session tracking
- Top email domains to identify user demographics

### Privacy Considerations
- All personal data is anonymized for analytics purposes
- Email addresses are stored with partial masking for privacy
- Session data is separated from personally identifiable information
- GDPR-compliant data collection with consent mechanisms

## Analytics Dashboard

The application includes a comprehensive analytics dashboard with real-time data visualization:

### Features
- **Real-time data refresh** with auto-refresh capability
- **Interactive charts** showing session completion, event types, and email domains
- **Filtering and search** for event logs
- **Data export** to CSV for further analysis
- **Time period selection** (daily, weekly, monthly, custom date range) for analytics overview
- **User journey funnel visualization** to identify dropout points
- **Conversion trend tracking** to monitor performance over time
- **Contextual help tooltips** for metrics interpretation
- **Automatic improvement suggestions** based on analytics data

### Usage
Access the analytics dashboard from the admin section at `/admin/analytics`. The dashboard provides:
1. Overview metrics for sessions and completion rates
2. Visual charts for key performance indicators
3. Detailed event logs with search and filter capabilities
4. Export functionality for offline analysis

## Storage Configuration

BoothBuddy supports multiple storage providers for media files:

### Environment Variables

Configure storage using the following environment variables:

- `STORAGE_PROVIDER`: Set to `"auto"`, `"local"`, or `"vercel"` (default: `"auto"`)
  - `auto`: Automatically uses Vercel Blob when deployed on Vercel, local storage otherwise
  - `local`: Always uses local file system storage
  - `vercel`: Always uses Vercel Blob storage

- `ENABLE_VERCEL_BLOB`: Set to `"true"` or `"false"` (default: `"true"`)
  - Controls whether Vercel Blob is used when `STORAGE_PROVIDER` is set to `"auto"` and running on Vercel

- `LOCAL_UPLOAD_PATH`: Directory within the public folder for uploaded files (default: `"uploads"`)
  - Example: If set to `"media"`, files will be stored in `/public/media/`

- `STORAGE_BASE_URL`: (Optional) Override the base URL for accessing media files
  - Useful for CDN configurations or custom domains for your media

### Storage Implementations

The application uses a unified storage interface that abstracts the details of the underlying storage mechanism:

- **Local Storage**: Files are stored in the public directory and served directly by the Next.js application
- **Vercel Blob Storage**: Files are stored in Vercel's Blob storage service, which provides CDN-backed storage

For Vercel Blob storage, you'll need to set up a Vercel project and set the `BLOB_READ_WRITE_TOKEN` environment variable.

## License
TBD

## User-Specific Admin Interface

The application now implements a user-specific admin interface accessible via the `/u/[username]/admin/` route structure:

### Features
- **User-Specific Dashboard**: Each user has their own dedicated admin dashboard
- **Role-Based Access Control**: Only ADMIN users can access admin routes
- **User-Specific Settings**: Manage settings specific to a user account
- **Custom Event URL Management**: Create and manage event URLs for specific user accounts
- **Session Management**: View and manage photo booth sessions for specific users

### Routes
- `/u/[username]/admin` - User-specific dashboard with quick actions and usage stats
- `/u/[username]/admin/settings` - Settings management for specific user
- `/u/[username]/admin/event-urls` - Event URL management for specific user
- `/u/[username]/admin/sessions` - Session management for specific user

## Role System

The application uses a role-based access control system:

### User Roles
- **ADMIN**: Full administrative access to all system functions
- **CUSTOMER**: Regular user access with limited administrative capabilities

The role system ensures proper separation of concerns and data security across the application.