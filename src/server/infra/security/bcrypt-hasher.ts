import bcrypt from "bcryptjs";
import type { IPasswordHasher } from "@/server/domain/security";

// Strategy: bcrypt password hashing. genSalt() produces a fresh random salt per
// password, which bcrypt embeds into the resulting hash string — so verify()
// needs only the hash. Swapping to argon2 later means adding a sibling class
// that implements IPasswordHasher; nothing else changes.
export class BcryptHasher implements IPasswordHasher {
  constructor(private readonly rounds: number) {}

  async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.rounds);
    return bcrypt.hash(plain, salt);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
