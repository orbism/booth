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
    ];
  },
  
  // Fix for route parameters in Next.js 15
  experimental: {
    staleTimes: {
      dynamic: 0 // Disable caching for dynamic routes
    }
  },
};

module.exports = nextConfig; 