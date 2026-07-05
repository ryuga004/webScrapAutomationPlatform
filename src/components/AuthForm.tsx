"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const INPUT =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary";

// Shared UI for the login and register screens. `mode` toggles the extra
// username field and which auth action runs.
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { status, login, register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in → go to the dashboard.
  useEffect(() => {
    if (status === "authenticated") router.replace("/workflows");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") await register(username, email, password);
      else await login(email, password);
      router.replace("/workflows");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            WebBot
          </span>
          <h1 className="mt-3 font-display text-xl font-semibold text-on-surface">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isRegister
              ? "Start building website automations."
              : "Sign in to your workflows."}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
        >
          {isRegister && (
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jane"
                autoComplete="username"
                className={INPUT}
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              className={INPUT}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={isRegister ? "new-password" : "current-password"}
              className={INPUT}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-on-surface-variant">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to WebBot?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
