import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "./auth-service";
import {
  AuthError,
  ConflictError,
  ValidationError,
} from "@/server/domain/errors";
import {
  FakeHasher,
  FakeTokenService,
  FakeUserRepository,
} from "@/server/testing/fakes";

function makeService() {
  const users = new FakeUserRepository();
  const service = new AuthService(users, new FakeHasher(), new FakeTokenService());
  return { users, service };
}

const valid = {
  username: "jane",
  email: "jane@example.com",
  password: "password123",
};

describe("AuthService.register", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => (ctx = makeService()));

  it("creates a user and returns a token + public user (no hash)", async () => {
    const res = await ctx.service.register(valid);
    expect(res.token).toBeTruthy();
    expect(res.user).toMatchObject({ username: "jane", email: "jane@example.com" });
    expect(res.user).not.toHaveProperty("passwordHash");
    // Stored hash is derived, not the plaintext.
    expect(ctx.users.users[0].passwordHash).toBe("hashed:password123");
  });

  it("lowercases and trims the email", async () => {
    const res = await ctx.service.register({ ...valid, email: "  JANE@Example.com " });
    expect(res.user.email).toBe("jane@example.com");
  });

  it.each([
    ["short username", { ...valid, username: "ab" }],
    ["invalid email", { ...valid, email: "nope" }],
    ["short password", { ...valid, password: "short" }],
  ])("rejects %s with ValidationError", async (_label, input) => {
    await expect(ctx.service.register(input)).rejects.toThrow(ValidationError);
  });

  it("rejects a duplicate email", async () => {
    await ctx.service.register(valid);
    await expect(
      ctx.service.register({ ...valid, username: "other" }),
    ).rejects.toThrow(ConflictError);
  });

  it("rejects a duplicate username", async () => {
    await ctx.service.register(valid);
    await expect(
      ctx.service.register({ ...valid, email: "other@example.com" }),
    ).rejects.toThrow(ConflictError);
  });
});

describe("AuthService.login", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(async () => {
    ctx = makeService();
    await ctx.service.register(valid);
  });

  it("logs in with correct credentials", async () => {
    const res = await ctx.service.login({ email: valid.email, password: valid.password });
    expect(res.token).toBeTruthy();
    expect(res.user.username).toBe("jane");
  });

  it("rejects a wrong password with AuthError", async () => {
    await expect(
      ctx.service.login({ email: valid.email, password: "wrong" }),
    ).rejects.toThrow(AuthError);
  });

  it("rejects an unknown email with AuthError", async () => {
    await expect(
      ctx.service.login({ email: "ghost@example.com", password: valid.password }),
    ).rejects.toThrow(AuthError);
  });
});

describe("AuthService.authenticate", () => {
  it("resolves the user for a valid token", async () => {
    const { service } = makeService();
    const { token } = await service.register(valid);
    const user = await service.authenticate(token);
    expect(user.username).toBe("jane");
  });

  it("throws AuthError when the user no longer exists", async () => {
    const users = new FakeUserRepository();
    const tokens = new FakeTokenService();
    const service = new AuthService(users, new FakeHasher(), tokens);
    const orphanToken = tokens.sign({
      sub: "user_missing",
      username: "x",
      email: "x@x.com",
      role: "USER",
    });
    await expect(service.authenticate(orphanToken)).rejects.toThrow(AuthError);
  });
});
