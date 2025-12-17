import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: '/api/manifest',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;