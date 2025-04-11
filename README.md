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

### 2. Install dependencies

`bashnpm install`

### 3. Set up environment variables

Copy the sample environment file and update it with your own values:

`.env.sample .env.local`

Edit `.env.local` with your database connection string, SMTP settings, and other configuration.

### 4. Set up the database

Run Prisma migrations to create your database schema:
`npm run db:migrate`

Seed the database with initial data:
`npm run db:seed`

### 5. Start the development server
`bashnpm run dev`

The application will be available at http://localhost:3000

## Project Structure

`/src/app`: Next.js App Router pages and API routes
`/src/components`: React components organized by function
`/src/hooks`: Custom React hooks
`/src/lib`: Utility functions and libraries
`/prisma`: Database schema and migrations

## Development Workflow

1. Create a new branch for your feature or fix
2. Make your changes with clear, descriptive commits
3. Push your branch and create a pull request
4. After review and approval, merge to the main branch

## Deployment

Follow these steps to deploy the application:

1. Build the application:
`npm run build`

2. Start the production server:
`npm start`

## License
TBD