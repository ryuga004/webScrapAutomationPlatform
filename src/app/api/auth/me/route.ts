import { requireUser } from "@/server/http/auth";
import { handleError, json, preflight } from "@/server/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// Returns the current user for a valid bearer token — used by the frontend to
// restore a session on page load.
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return json({ user });
  } catch (err) {
    return handleError(err);
  }
}
