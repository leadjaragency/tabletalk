import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from common external CDNs / upload providers
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // Packages that use native Node.js modules — must not be bundled by webpack
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcryptjs", "mammoth"],

  // TypeScript type errors will still fail the build via tsc
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
