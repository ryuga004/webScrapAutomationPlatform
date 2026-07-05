import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for containerised /
  // self-hosted deploys. Platforms like Vercel that build their own can ignore it.
  output: "standalone",
  // Prisma's query-engine binary is loaded at runtime, so file tracing can't see
  // it. Force it (and the schema) into the standalone bundle for the API routes.
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/.prisma/client/**", "./prisma/schema.prisma"],
  },
  // Accept dev-server requests from 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
