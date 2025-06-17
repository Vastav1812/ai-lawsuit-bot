import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  experimental: {
    // Allow your local network IP
    // allowedOrigins: ['http://192.168.29.191:3001'],
  },
};

export default nextConfig;