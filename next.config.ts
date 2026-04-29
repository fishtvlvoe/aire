import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfjs-dist"],
  allowedDevOrigins: ["192.168.1.197"],
};

export default nextConfig;
