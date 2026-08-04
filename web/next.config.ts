import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/terms",
        destination: "https://www.dradix.dev/terms",
        permanent: true,
      },
      {
        source: "/terms-of-service",
        destination: "https://www.dradix.dev/terms",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "https://www.dradix.dev/privacy",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "https://www.dradix.dev/privacy",
        permanent: true,
      },
    ];
  },
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
