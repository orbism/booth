/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify has been removed as it's no longer needed in Next.js 15+
  
  // Configure allowed image domains
  images: {
    domains: [
      'wtkibydara8vvh8z.public.blob.vercel-storage.com', // Vercel Blob storage domain
      'public.blob.vercel-storage.com',                  // Generic Vercel Blob domain
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        // Special headers for event URL routes to prevent caching
        source: '/e/:urlPath*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // Fix for route parameters in Next.js 15
  experimental: {
    // Ensure dynamic routes are never cached
    staleTimes: {
      dynamic: 0, // Disable caching for dynamic routes
    },
    // Disable automatic static optimization for dynamic routes
    // This ensures the page is always server-rendered
    workerThreads: false,
    optimizeCss: false,
  },
  
  // Ensure all pages are server-side rendered by default
  // Particularly important for dynamic routes
  output: 'standalone',
};

module.exports = nextConfig; 