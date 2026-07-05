import { authService } from "@/server/container";
import { handleError, json, preflight } from "@/server/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await authService.login({
      email: body.email,
      password: body.password,
    });
    return json(result, 200);
  } catch (err) {
    return handleError(err);
  }
}
