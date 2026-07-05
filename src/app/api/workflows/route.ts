import { workflowService } from "@/server/container";
import { requireUser } from "@/server/http/auth";
import { handleError, json, preflight } from "@/server/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const workflows = await workflowService.list(user.id);
    return json({ workflows });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const workflow = await workflowService.create(user.id, body);
    return json({ workflow }, 201);
  } catch (err) {
    return handleError(err);
  }
}
