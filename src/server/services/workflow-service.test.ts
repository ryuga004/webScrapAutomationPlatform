import { describe, it, expect, beforeEach } from "vitest";
import { WorkflowService } from "./workflow-service";
import { NotFoundError, ValidationError } from "@/server/domain/errors";
import { nodeValidatorRegistry } from "@/server/validation/node-validator-registry";
import { FakeWorkflowRepository } from "@/server/testing/fakes";
import type { WorkflowRunResult } from "@/lib/workflow";

const USER = "user_1";
const OTHER = "user_2";

// A minimal valid graph — a lone Start node has no required config.
const validBody = {
  name: "My workflow",
  nodes: [{ id: "n1", type: "start", position: { x: 0, y: 0 }, config: {} }],
  edges: [],
};

function makeService() {
  const repo = new FakeWorkflowRepository();
  return { repo, service: new WorkflowService(repo, nodeValidatorRegistry) };
}

describe("WorkflowService", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => (ctx = makeService()));

  it("creates and reads back a workflow for its owner", async () => {
    const created = await ctx.service.create(USER, validBody);
    expect(created.id).toBeTruthy();
    const fetched = await ctx.service.get(created.id, USER);
    expect(fetched.name).toBe("My workflow");
  });

  it("hides another user's workflow (NotFound, not Forbidden leak)", async () => {
    const created = await ctx.service.create(USER, validBody);
    await expect(ctx.service.get(created.id, OTHER)).rejects.toThrow(NotFoundError);
  });

  it("throws NotFound for a missing workflow", async () => {
    await expect(ctx.service.get("nope", USER)).rejects.toThrow(NotFoundError);
  });

  it("updates only for the owner", async () => {
    const created = await ctx.service.create(USER, validBody);
    const updated = await ctx.service.update(created.id, USER, {
      ...validBody,
      name: "Renamed",
    });
    expect(updated.name).toBe("Renamed");
    await expect(
      ctx.service.update(created.id, OTHER, validBody),
    ).rejects.toThrow(NotFoundError);
  });

  it("deletes only for the owner and is idempotent-safe", async () => {
    const created = await ctx.service.create(USER, validBody);
    await expect(ctx.service.remove(created.id, OTHER)).rejects.toThrow(NotFoundError);
    await ctx.service.remove(created.id, USER);
    await expect(ctx.service.remove(created.id, USER)).rejects.toThrow(NotFoundError);
  });

  it("saves a run for the owner", async () => {
    const created = await ctx.service.create(USER, validBody);
    const result: WorkflowRunResult = {
      ok: true,
      startedAt: "t0",
      finishedAt: "t1",
      durationMs: 5,
      nodes: [],
    };
    await ctx.service.saveRun(created.id, USER, result);
    expect(ctx.repo.runs).toHaveLength(1);
    await expect(
      ctx.service.saveRun(created.id, OTHER, result),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects an unknown node type", async () => {
    await expect(
      ctx.service.create(USER, {
        ...validBody,
        nodes: [{ id: "n1", type: "does-not-exist", position: { x: 0, y: 0 }, config: {} }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a node missing a required field", async () => {
    await expect(
      ctx.service.create(USER, {
        ...validBody,
        // "goto" requires a url.
        nodes: [{ id: "n1", type: "goto", position: { x: 0, y: 0 }, config: {} }],
      }),
    ).rejects.toThrow(ValidationError);
  });
});
