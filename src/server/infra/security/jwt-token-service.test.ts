import { describe, it, expect } from "vitest";
import { JwtTokenService } from "./jwt-token-service";
import { AuthError } from "@/server/domain/errors";
import type { TokenPayload } from "@/server/domain/security";

const payload: TokenPayload = {
  sub: "user_1",
  username: "jane",
  email: "jane@example.com",
  role: "USER",
};

describe("JwtTokenService", () => {
  const svc = new JwtTokenService("test-secret", "1h");

  it("signs and verifies a round trip", () => {
    const token = svc.verify(svc.sign(payload));
    expect(token.sub).toBe("user_1");
    expect(token.email).toBe("jane@example.com");
  });

  it("throws AuthError for a tampered/invalid token", () => {
    expect(() => svc.verify("not-a-real-token")).toThrow(AuthError);
  });

  it("throws AuthError for a token signed with a different secret", () => {
    const other = new JwtTokenService("different-secret", "1h");
    expect(() => svc.verify(other.sign(payload))).toThrow(AuthError);
  });

  it("honours an expiry override", () => {
    const token = svc.sign(payload, "30d");
    const decoded = svc.verify(token) as TokenPayload & { exp: number; iat: number };
    // 30 days ≈ 2,592,000s; assert it's far beyond the default 1h.
    expect(decoded.exp - decoded.iat).toBeGreaterThan(60 * 60 * 24 * 20);
  });
});
