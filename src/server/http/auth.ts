import { authService } from "@/server/container";
import { AuthError } from "@/server/domain/errors";
import type { PublicUser } from "@/server/services/auth-service";

/**
 * Extract and verify the bearer token from a request, returning the current
 * user. Throws AuthError (→ 401) if missing/invalid. Route handlers call this
 * first to enforce authentication + load the caller's identity.
 */
export async function requireUser(request: Request): Promise<PublicUser> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    throw new AuthError("Missing bearer token");
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new AuthError("Missing bearer token");
  return authService.authenticate(token);
}
