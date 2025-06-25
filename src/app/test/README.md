# Settings Troubleshooting Guide

This guide helps you diagnose and fix issues with booth settings, especially for Customer users.

## Common Issues

### "Settings not found for this URL"

This error occurs when a booth URL exists but the user who owns it doesn't have settings configured.

#### How to fix:

1. Go to `/test/check-settings?urlPath=YOUR_URL_PATH` to verify if settings exist
2. If you're an admin, use the "Create Default Settings" button
3. If you're a Customer, go to your settings page at `/u/YOUR_USERNAME/settings` and configure your settings
4. After creating settings, invalidate the cache and reload the booth page

### Settings changes not reflected in the booth

If you've made changes to settings but they're not showing up in the booth:

1. Go to `/test/diagnose?urlPath=YOUR_URL_PATH` to check if the API and database are in sync
2. Use the "Invalidate Server Cache" and "Clear Local Cache" buttons
3. Completely reload the booth page with Ctrl+Shift+R
4. Check for any console errors using browser dev tools

## Diagnostic Tools

- **Check Settings**: `/test/check-settings` - Directly checks database for settings
- **Settings Diagnostics**: `/test/diagnose` - Compares database settings with API response
- **Booth Debug View**: `/e/YOUR_URL_PATH/debug` - Shows settings for a specific booth

## For Customers

If you're a Customer user and your booth settings aren't working:

1. Make sure you've configured settings in your dashboard
2. Check that you're using the right URL path
3. After making changes, always wait a few seconds for them to propagate
4. Try a hard refresh (Ctrl+Shift+R) of your booth page

## For Admins

As an admin, you can:

1. Create default settings for users who don't have them
2. Check the database directly for any issues
3. Invalidate caches when users report problems
4. Add the URL parameter `?debug=true` to any booth URL to see additional debug information

## Boolean Settings Values

Many settings issues are related to boolean values not being handled correctly:

- Values in the database are stored as integers (0/1)
- The API converts these to actual boolean values (true/false)
- Client code must correctly handle both string representations ("true"/"false") and actual booleans

The latest implementation handles all these cases automatically.

## Support

If you need additional help, please contact the development team with the following information:

1. The URL path you're having issues with
2. Screenshots of the diagnostic pages
3. Any error messages from the browser console
4. Steps you've already taken to try to fix the issue 