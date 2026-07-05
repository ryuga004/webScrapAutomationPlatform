import type { IWorkflowRepository } from "@/server/domain/repositories";
import type { NodeValidatorRegistry } from "@/server/validation/node-validator-registry";
import { parseWorkflowInput } from "@/lib/validate-workflow";
import { NotFoundError, ValidationError } from "@/server/domain/errors";
import type { Workflow, WorkflowRunResult } from "@/lib/workflow";

// Application service for workflows. Every method is scoped to a userId, so
// ownership/authorization is enforced in one place. Graph-shape validation is
// delegated to parseWorkflowInput; per-node config validation to the registry.
export class WorkflowService {
  constructor(
    private readonly repo: IWorkflowRepository,
    private readonly validators: NodeValidatorRegistry,
  ) {}

  list(userId: string): Promise<Workflow[]> {
    return this.repo.listByUser(userId);
  }

  async get(id: string, userId: string): Promise<Workflow> {
    const wf = await this.repo.findByIdForUser(id, userId);
    if (!wf) throw new NotFoundError("Workflow not found");
    return wf;
  }

  async create(userId: string, body: unknown): Promise<Workflow> {
    // `async` so validation failures reject the promise rather than throwing
    // synchronously — a uniform contract across every service method.
    return this.repo.create(userId, this.parseAndValidate(body));
  }

  async update(id: string, userId: string, body: unknown): Promise<Workflow> {
    const wf = await this.repo.update(id, userId, this.parseAndValidate(body));
    if (!wf) throw new NotFoundError("Workflow not found");
    return wf;
  }

  async remove(id: string, userId: string): Promise<void> {
    const ok = await this.repo.delete(id, userId);
    if (!ok) throw new NotFoundError("Workflow not found");
  }

  async saveRun(
    id: string,
    userId: string,
    result: WorkflowRunResult,
  ): Promise<void> {
    const ok = await this.repo.saveRun(id, userId, result);
    if (!ok) throw new NotFoundError("Workflow not found");
  }

  private parseAndValidate(body: unknown) {
    const input = parseWorkflowInput(body);
    const errors = this.validators.validateNodes(input.nodes);
    if (errors.length) throw new ValidationError(errors.join("; "));
    return input;
  }
}
