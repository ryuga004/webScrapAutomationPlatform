import { AppError } from "@/server/domain/errors";

// CORS: the browser extension fetches these routes cross-origin.
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function json(data: unknown, status = 200): Response {
  return Response.json(data as object, { status, headers: CORS_HEADERS });
}

export function preflight(): Response {
  return new Response(null, { headers: CORS_HEADERS });
}

/**
 * Translate any thrown error into an HTTP response. Known AppErrors carry their
 * own status + code; anything else is an unexpected 500 (logged, not leaked).
 */
export function handleError(err: unknown): Response {
  if (err instanceof AppError) {
    return json({ error: err.message, code: err.code }, err.status);
  }
  console.error("[unhandled]", err);
  return json({ error: "Internal server error", code: "INTERNAL" }, 500);
}
