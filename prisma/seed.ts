// Seed script: creates a demo user so you can log in immediately after setup.
// Run with `npm run db:seed` (requires DATABASE_URL to point at a live DB).
//
// Uses the same BcryptHasher as the app so the stored hash is identical in
// shape to production — no special-casing.

import { PrismaClient } from "@prisma/client";
import { BcryptHasher } from "../src/server/infra/security/bcrypt-hasher";

const prisma = new PrismaClient();

async function main() {
  const hasher = new BcryptHasher(12);
  const email = "demo@webbot.dev";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Demo user already exists: ${email}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      username: "demo",
      email,
      passwordHash: await hasher.hash("password123"),
    },
  });
  console.log(`Created demo user: ${user.email} (password: "password123")`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
