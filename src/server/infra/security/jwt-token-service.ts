import jwt from "jsonwebtoken";
import type { ITokenService, TokenPayload } from "@/server/domain/security";
import { AuthError } from "@/server/domain/errors";

// Strategy: stateless JWT access tokens signed with HS256.
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(payload: TokenPayload, expiresIn?: string): string {
    const options: jwt.SignOptions = {
      expiresIn: (expiresIn ??
        this.expiresIn) as jwt.SignOptions["expiresIn"],
    };
    return jwt.sign(payload, this.secret, options);
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret);
      if (typeof decoded === "string" || !decoded.sub) {
        throw new AuthError("Malformed token");
      }
      return decoded as unknown as TokenPayload;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw new AuthError("Invalid or expired token");
    }
  }
}
