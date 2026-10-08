import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mysql2 / exceljs / bcryptjs run only on the server
  serverExternalPackages: ["mysql2", "exceljs"],
};

export default nextConfig;
