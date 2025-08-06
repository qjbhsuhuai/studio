import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Point to the default production server.
        // The client-side will use the active URL from settings.
        destination: 'https://cfgnnn-production.up.railway.app/api/:path*',
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // For file uploads
    },
  },
};

export default nextConfig;
