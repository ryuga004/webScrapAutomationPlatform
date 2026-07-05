import { PrismaClient } from "@prisma/client";

// A single PrismaClient per process. Next.js dev reloads modules on every edit,
// which would otherwise leak a new client (and connection pool) each time, so we
// cache it on globalThis outside production.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
