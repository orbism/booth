# BoothBoss Photo Booth Application

A modern, AI-powered photo booth application built with Next.js, TypeScript, and Prisma.

## Features

- User-friendly photo capture experience
- Customizable countdown timer
- Email sharing with captured photos
- Admin dashboard for managing settings
- Responsive design for various devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **Email**: Nodemailer with DreamHost SMTP

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

### Routes
- `/admin` - Main dashboard with recent sessions
- `/admin/sessions` - Complete list of all photo booth sessions
- `/admin/settings` - Booth configuration settings

Access to these routes is protected by authentication middleware.

## Custom User Journey

The application includes a powerful Custom User Journey builder for creating personalized photo booth experiences:

### Features
- Visual journey editor with drag-and-drop organization
- Custom text, background images, and button styling
- Up to 8 customizable pages in the journey flow
- Import/export journey configurations for reuse
- Preview mode to visualize the complete journey flow

### Configuration
1. Access the journey builder from the admin dashboard under Settings > Custom Journey
2. Enable custom journey mode with the toggle switch
3. Add pages using the "Add Page" button
4. Customize each page with text, backgrounds, and button properties
5. Reorder pages using the up/down arrows
6. Save configuration when complete

### Technical Details
- Journey configurations are stored as JSON in the database
- Background images are stored in the public uploads directory
- Custom buttons support both text and image modes

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

## License
TBD