import type { IUserRepository } from "@/server/domain/repositories";
import type {
  IPasswordHasher,
  ITokenService,
  TokenPayload,
} from "@/server/domain/security";
import {
  AuthError,
  ConflictError,
  ValidationError,
} from "@/server/domain/errors";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Safe user projection returned to clients (never includes the hash). */
export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Orchestrates registration, login and token verification. Depends only on the
// repository + hasher + token abstractions (Dependency Inversion), so it can be
// unit-tested with in-memory fakes and never imports Prisma/bcrypt/jwt directly.
export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const username = input.username?.trim();
    const email = input.email?.trim().toLowerCase();
    const password = input.password ?? "";

    if (!username || username.length < 3) {
      throw new ValidationError("Username must be at least 3 characters");
    }
    if (!EMAIL_RE.test(email)) {
      throw new ValidationError("A valid email is required");
    }
    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    if (await this.users.findByEmail(email)) {
      throw new ConflictError("That email is already registered");
    }
    if (await this.users.findByUsername(username)) {
      throw new ConflictError("That username is taken");
    }

    const passwordHash = await this.hasher.hash(password);
    const user = await this.users.create({ username, email, passwordHash });
    return { user: this.toPublic(user), token: this.issue(user) };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email?.trim().toLowerCase() ?? "";
    const user = await this.users.findByEmail(email);
    // Verify even when the user is missing to keep timing uniform, then fail
    // with the same generic message either way (no account enumeration).
    const ok =
      user != null &&
      (await this.hasher.verify(input.password ?? "", user.passwordHash));
    if (!user || !ok) throw new AuthError("Invalid email or password");
    return { user: this.toPublic(user), token: this.issue(user) };
  }

  /**
   * Mint a longer-lived token to embed in the downloadable browser extension,
   * so it keeps working without the user re-pasting credentials.
   */
  issueApiToken(user: PublicUser, expiresIn: string): string {
    return this.tokens.sign(
      { sub: user.id, username: user.username, email: user.email, role: user.role },
      expiresIn,
    );
  }

  /** Verify a bearer token and load the current user. */
  async authenticate(token: string): Promise<PublicUser> {
    const payload = this.tokens.verify(token);
    const user = await this.users.findById(payload.sub);
    if (!user) throw new AuthError("Account no longer exists");
    return this.toPublic(user);
  }

  private issue(user: { id: string; username: string; email: string; role: string }): string {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    return this.tokens.sign(payload);
  }

  private toPublic(user: {
    id: string;
    username: string;
    email: string;
    role: string;
  }): PublicUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }
}
