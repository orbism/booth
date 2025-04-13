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

## License
TBD