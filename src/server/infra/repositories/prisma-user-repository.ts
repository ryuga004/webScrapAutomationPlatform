import type { PrismaClient } from "@prisma/client";
import type {
  CreateUserData,
  IUserRepository,
  UserRecord,
} from "@/server/domain/repositories";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateUserData): Promise<UserRecord> {
    return this.prisma.user.create({ data });
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }
}
