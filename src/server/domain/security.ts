// Abstractions for the two security concerns the auth service depends on.
// Depending on these interfaces (not concrete bcrypt/jwt) keeps the service
// testable and lets us swap strategies (argon2, PASETO, …) without touching it
// — Dependency Inversion.

export interface IPasswordHasher {
  /** Hash a plaintext password (a fresh salt is generated per call). */
  hash(plain: string): Promise<string>;
  /** Constant-time compare of a plaintext password against a stored hash. */
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface TokenPayload {
  /** Subject — the user id. */
  sub: string;
  username: string;
  email: string;
  role: string;
}

export interface ITokenService {
  /** Sign a token. `expiresIn` overrides the default lifetime when provided. */
  sign(payload: TokenPayload, expiresIn?: string): string;
  /** Verify + decode a token. Throws AuthError if invalid/expired. */
  verify(token: string): TokenPayload;
}
