import { describe, it, expect } from "vitest";
import { BcryptHasher } from "./bcrypt-hasher";

describe("BcryptHasher", () => {
  // Low cost factor keeps tests fast; behaviour is identical.
  const hasher = new BcryptHasher(4);

  it("verifies a correct password", async () => {
    const hash = await hasher.hash("s3cret-password");
    expect(await hasher.verify("s3cret-password", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hasher.hash("s3cret-password");
    expect(await hasher.verify("wrong", hash)).toBe(false);
  });

  it("produces a different hash each time (unique salt)", async () => {
    const a = await hasher.hash("same");
    const b = await hasher.hash("same");
    expect(a).not.toBe(b);
    // ...but both still verify.
    expect(await hasher.verify("same", a)).toBe(true);
    expect(await hasher.verify("same", b)).toBe(true);
  });
});
