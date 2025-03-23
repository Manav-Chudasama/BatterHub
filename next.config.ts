import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["i.pravatar.cc", "images.unsplash.com"],
  },
  async headers() {
    return [
      // Add CORS headers to API routes
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, X-Requested-With, svix-id, svix-timestamp, svix-signature",
          },
        ],
      },
      // Specific configuration for webhook endpoints
      {
        source: "/api/webhooks/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, svix-id, svix-timestamp, svix-signature",
          },
          { key: "Access-Control-Max-Age", value: "86400" }, // 24 hours
        ],
      },
    ];
  },
};

export default nextConfig;
