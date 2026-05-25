import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: { unoptimized: true },
  compress: true,
  serverExternalPackages: ["drizzle-orm", "pg"],
};

export default nextConfig;
