import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
        basePath: false,
      },
    ]
  },
  // Note: Next.js does not support custom timeout keys here. Keep rewrites only.
};

export default nextConfig;
