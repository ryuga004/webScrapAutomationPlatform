import { workflowService } from "@/server/container";
import { requireUser } from "@/server/http/auth";
import { handleError, json, preflight } from "@/server/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return preflight();
}

export async function GET(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const workflow = await workflowService.get(id, user.id);
    return json({ workflow });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const workflow = await workflowService.update(id, user.id, body);
    return json({ workflow });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    await workflowService.remove(id, user.id);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
