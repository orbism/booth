# BoothBoss: External Services

## Version Control & CI/CD

### GitHub
- **Purpose**: Source code management, CI/CD workflows, issue tracking
- **Requirements**:
  - Organization account for team collaboration
  - Private repositories
  - GitHub Actions for CI/CD
  - Branch protection rules for `main` and `develop`
- **Setup Tasks**:
  - Create organization
  - Set up repositories with proper access controls
  - Configure branch protection rules
  - Set up issue templates and project boards

## Hosting & Deployment

### Vercel
- **Purpose**: Frontend hosting and serverless functions
- **Requirements**:
  - Pro plan ($20/month) for:
    - Increased build minutes
    - Team collaboration
    - Preview deployments
    - Custom domains
- **Setup Tasks**:
  - Connect GitHub repository
  - Configure environment variables
  - Set up preview deployments
  - Configure custom domains

### DreamHost
- **Purpose**: Database hosting, media storage
- **Requirements**:
  - Shared Unlimited Plan (~$10/month) or VPS
  - MySQL database
  - Custom subdomain for media access
- **Setup Tasks**:
  - Set up MySQL database with proper access controls
  - Configure storage directories with appropriate permissions
  - Set up SFTP access for deployments
  - Configure backups

## Authentication

### NextAuth.js
- **Purpose**: Authentication system
- **Requirements**:
  - Email/password provider
  - OAuth providers (Google, Apple)
  - JWT configuration
- **Setup Tasks**:
  - Configure authentication providers
  - Set up database adapter for user persistence
  - Configure JWT secret and settings

## Email Services

### SendGrid
- **Purpose**: Transactional emails, user notifications
- **Requirements**:
  - Essentials plan ($19.95/month) for:
    - Up to 50,000 emails/month
    - Dedicated IP address
    - Email validation
- **Setup Tasks**:
  - Create account and verify domain
  - Set up email templates for:
    - User registration/verification
    - Password reset
    - Photo/video sharing
    - Receipt/invoices
  - Configure DKIM/SPF records

## Payment Processing

### Stripe
- **Purpose**: Handle payments for licenses and subscriptions
- **Requirements**:
  - Standard account (pay-as-you-go)
  - Recurring billing capability
  - Webhook integration
- **Setup Tasks**:
  - Create account and configure webhooks
  - Set up products and pricing plans
  - Configure payment methods
  - Set up webhook endpoints in application

## Media Processing

### Cloudinary
- **Purpose**: Image and video processing/optimization
- **Requirements**:
  - Plus plan ($99/month) for:
    - 25GB storage
    - 25GB bandwidth
    - Advanced transformations
- **Setup Tasks**:
  - Create account and configure API keys
  - Set up upload presets
  - Configure transformation profiles

### Replicate
- **Purpose**: AI model hosting for image enhancement and AR features
- **Requirements**:
  - Pay-as-you-go plan (starting at ~$0.10 per API call)
  - Custom model training options
- **Setup Tasks**:
  - Create account and generate API keys
  - Deploy selected AI models
  - Set up webhooks for processing results

### TensorFlow.js Model Hosting
- **Purpose**: Local AI model serving for offline capabilities
- **Requirements**:
  - Optimized and quantized TensorFlow.js models
  - Caching and version management
- **Setup Tasks**:
  - Convert models to TensorFlow.js format
  - Implement model caching strategy
  - Set up fallback to server models when online

## Monitoring & Analytics

### Sentry
- **Purpose**: Error tracking and performance monitoring
- **Requirements**:
  - Team plan ($26/month) for:
    - Unlimited projects
    - 50,000 errors/month
    - 30-day data retention
- **Setup Tasks**:
  - Create account and configure project
  - Set up error boundaries in React components
  - Configure alert notifications

### Plausible Analytics
- **Purpose**: Privacy-friendly website analytics
- **Requirements**:
  - Starter plan ($9/month) for:
    - Up to 10,000 monthly pageviews
    - Unlimited websites
- **Setup Tasks**:
  - Create account and configure domain
  - Add tracking script to application
  - Set up custom events

## Testing Services

### BrowserStack
- **Purpose**: Cross-browser and device testing
- **Requirements**:
  - Live plan ($29/month) for:
    - Live testing on real devices
    - Multiple browsers and OS versions
- **Setup Tasks**:
  - Create account and configure access
  - Set up testing scripts
  - Integrate with CI pipeline

## SMS Notifications (Optional)

### Twilio
- **Purpose**: SMS notifications and verification
- **Requirements**:
  - Pay-as-you-go plan
  - Phone number ($1/month)
  - SMS capability (~$0.0075 per message)
- **Setup Tasks**:
  - Create account and purchase number
  - Configure SMS templates
  - Set up webhook endpoints

## Domain & DNS

### Domain Registrar
- **Purpose**: Domain registration and management
- **Requirements**:
  - Domain name registration (~$15/year)
  - DNS management
  - HTTPS certificates
- **Setup Tasks**:
  - Register domain name
  - Configure DNS records for:
    - Website (Vercel)
    - Media storage (DreamHost)
    - Email services (SendGrid)
  - Set up HTTPS certificates

## Development Tools

### Figma
- **Purpose**: UI/UX design and collaboration
- **Requirements**:
  - Professional plan ($12/editor/month) for:
    - Unlimited projects
    - Team libraries
    - Sharing and collaboration
- **Setup Tasks**:
  - Create account and team
  - Set up design system
  - Create UI component library

### Notion
- **Purpose**: Documentation and project management
- **Requirements**:
  - Team plan ($8/user/month) for:
    - Unlimited blocks
    - Collaborative workspace
    - Version history
- **Setup Tasks**:
  - Create workspace and team
  - Set up documentation structure
  - Create project roadmap and timeline

## API Services

### Mapbox (Optional)
- **Purpose**: Location services for event mapping
- **Requirements**:
  - Pay-as-you-go plan
  - Up to 50,000 map loads/month (free tier)
- **Setup Tasks**:
  - Create account and generate API keys
  - Configure map styles
  - Implement map components

### Unsplash API (Optional)
- **Purpose**: Stock photography for templates
- **Requirements**:
  - Production application (~$0.0001 per request, first 50,000 free)
- **Setup Tasks**:
  - Create account and generate API keys
  - Configure image search and selection
  - Implement image browsing component

## License Management

### Custom License Server
- **Purpose**: Generate and validate license keys
- **Requirements**:
  - Server-side implementation
  - Secure key generation and validation
  - License activation/deactivation
- **Setup Tasks**:
  - Develop license generation algorithm
  - Create admin interface for license management
  - Implement license validation endpoints

## Cost Summary

### Essential Services (Monthly)
- Vercel: $20
- DreamHost: $10
- SendGrid: $19.95
- Sentry: $26
- Plausible: $9
- **Total Essential**: ~$85/month

### Optional Services (Monthly)
- Cloudinary: $99
- BrowserStack: $29
- Twilio: ~$10 (depends on usage)
- Figma: $12/user
- Notion: $8/user
- **Total Optional**: ~$158/month (plus per-user costs)

### One-time/Annual Costs
- Domain Registration: ~$15/year
- SSL Certificates: Free with Let's Encrypt
- **Total Annual**: ~$15/year