import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "biffes.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
