// Persistence abstractions. Services talk to these interfaces; the Prisma
// implementations live in src/server/infra. This is the Repository pattern +
// Dependency Inversion — the domain never imports Prisma.

import type {
  Workflow,
  WorkflowInput,
  WorkflowRunResult,
} from "@/lib/workflow";

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  username: string;
  email: string;
  passwordHash: string;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserRecord>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
}

export interface IWorkflowRepository {
  listByUser(userId: string): Promise<Workflow[]>;
  findByIdForUser(id: string, userId: string): Promise<Workflow | null>;
  create(userId: string, input: WorkflowInput): Promise<Workflow>;
  update(id: string, userId: string, input: WorkflowInput): Promise<Workflow | null>;
  delete(id: string, userId: string): Promise<boolean>;
  saveRun(id: string, userId: string, result: WorkflowRunResult): Promise<boolean>;
}
