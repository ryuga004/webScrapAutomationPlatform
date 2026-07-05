import { Prisma, type PrismaClient } from "@prisma/client";
import type { IWorkflowRepository } from "@/server/domain/repositories";
import type {
  Workflow,
  WorkflowInput,
  WorkflowRunResult,
} from "@/lib/workflow";

type WorkflowWithRelations = Prisma.WorkflowGetPayload<{
  include: { nodes: true; edges: true; runs: true };
}>;

const INCLUDE = {
  nodes: true,
  edges: true,
  runs: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

function toDTO(w: WorkflowWithRelations): Workflow {
  return {
    id: w.id,
    name: w.name,
    viewport: (w.viewport as Workflow["viewport"]) ?? undefined,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
    nodes: w.nodes.map((n) => ({
      id: n.key,
      type: n.type,
      position: { x: n.positionX, y: n.positionY },
      config: (n.config as Record<string, unknown>) ?? {},
    })),
    edges: w.edges.map((e) => ({
      id: e.key,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
    lastRun: w.runs[0]
      ? (w.runs[0].result as unknown as WorkflowRunResult)
      : undefined,
  };
}

export class PrismaWorkflowRepository implements IWorkflowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByUser(userId: string): Promise<Workflow[]> {
    const rows = await this.prisma.workflow.findMany({
      where: { userId },
      include: INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toDTO);
  }

  async findByIdForUser(id: string, userId: string): Promise<Workflow | null> {
    const row = await this.prisma.workflow.findFirst({
      where: { id, userId },
      include: INCLUDE,
    });
    return row ? toDTO(row) : null;
  }

  async create(userId: string, input: WorkflowInput): Promise<Workflow> {
    const row = await this.prisma.workflow.create({
      data: {
        name: input.name,
        userId,
        viewport: (input.viewport as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        nodes: { create: this.nodeCreates(input, userId) },
        edges: { create: this.edgeCreates(input, userId) },
      },
      include: INCLUDE,
    });
    return toDTO(row);
  }

  async update(
    id: string,
    userId: string,
    input: WorkflowInput,
  ): Promise<Workflow | null> {
    const owned = await this.prisma.workflow.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!owned) return null;

    // Replace the graph wholesale — simplest correct semantics for an editor
    // that always sends the full node/edge set on save.
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.node.deleteMany({ where: { workflowId: id } });
      await tx.edge.deleteMany({ where: { workflowId: id } });
      return tx.workflow.update({
        where: { id },
        data: {
          name: input.name,
          viewport:
            (input.viewport as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          nodes: { create: this.nodeCreates(input, userId) },
          edges: { create: this.edgeCreates(input, userId) },
        },
        include: INCLUDE,
      });
    });
    return toDTO(row);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await this.prisma.workflow.deleteMany({ where: { id, userId } });
    return res.count > 0;
  }

  async saveRun(
    id: string,
    userId: string,
    result: WorkflowRunResult,
  ): Promise<boolean> {
    const owned = await this.prisma.workflow.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!owned) return false;
    await this.prisma.workflowRun.create({
      data: {
        workflowId: id,
        ok: result.ok,
        result: result as unknown as Prisma.InputJsonValue,
      },
    });
    return true;
  }

  private nodeCreates(input: WorkflowInput, userId: string) {
    return input.nodes.map((n) => ({
      key: n.id,
      type: n.type,
      positionX: n.position.x,
      positionY: n.position.y,
      config: (n.config as Prisma.InputJsonValue) ?? {},
      userId,
    }));
  }

  private edgeCreates(input: WorkflowInput, userId: string) {
    return input.edges.map((e) => ({
      key: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
      userId,
    }));
  }
}
