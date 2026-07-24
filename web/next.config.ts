import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy all /api/v1/* requests to the NestJS backend on port 4000
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:4000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
