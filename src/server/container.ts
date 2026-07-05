// Composition root (poor-man's DI container).
//
// This is the ONE place that wires concrete implementations to the abstractions
// the services depend on. Everything downstream receives its collaborators
// through constructors, so swapping bcrypt→argon2, JWT→PASETO, or Prisma→another
// store is a change here and nowhere else.

import { prisma } from "@/server/db/prisma";
import { config } from "@/server/config";
import { BcryptHasher } from "@/server/infra/security/bcrypt-hasher";
import { JwtTokenService } from "@/server/infra/security/jwt-token-service";
import { PrismaUserRepository } from "@/server/infra/repositories/prisma-user-repository";
import { PrismaWorkflowRepository } from "@/server/infra/repositories/prisma-workflow-repository";
import { AuthService } from "@/server/services/auth-service";
import { WorkflowService } from "@/server/services/workflow-service";
import { nodeValidatorRegistry } from "@/server/validation/node-validator-registry";

// Strategies
const passwordHasher = new BcryptHasher(config.bcryptRounds);
const tokenService = new JwtTokenService(config.jwtSecret, config.jwtExpiresIn);

// Repositories
const userRepository = new PrismaUserRepository(prisma);
const workflowRepository = new PrismaWorkflowRepository(prisma);

// Services
export const authService = new AuthService(
  userRepository,
  passwordHasher,
  tokenService,
);
export const workflowService = new WorkflowService(
  workflowRepository,
  nodeValidatorRegistry,
);
