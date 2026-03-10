import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    // Allow eval in development for Next.js hot reload and Google Sign-In
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Content-Security-Policy",
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
                "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https: blob:",
                "connect-src 'self' http://localhost:* ws://localhost:* https://accounts.google.com",
                "frame-src 'self' https://accounts.google.com",
              ].join("; "),
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
