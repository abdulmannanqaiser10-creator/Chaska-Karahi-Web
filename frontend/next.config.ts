import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow importing the shared database module from the sibling `backend/` folder.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
