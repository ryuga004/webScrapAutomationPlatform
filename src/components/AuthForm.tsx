"use client";

import Link from "next/link";
import { Mail, Lock, User, ArrowRight, MousePointerClick } from "lucide-react";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AuthField } from "./auth/AuthField";
import { BrandTile } from "./auth/BrandTile";
import { AuthFeatureTile } from "./auth/AuthFeatureTile";

// Login / register screen laid out as a neumorphic bento grid.
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const {
    isRegister,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    error,
    busy,
    onSubmit,
  } = useAuthForm(mode);

  return (
    <main className="neu-base flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-5xl auto-rows-fr grid-cols-1 gap-5 md:grid-cols-3">
        <div className="neu-raised flex flex-col justify-center p-8 md:col-span-2 md:row-span-2">
          <div className="mx-auto w-full max-w-md">
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-on-surface-variant">
              {isRegister
                ? "Start building your automation workflows."
                : "Log in to manage your automation workflows."}
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {isRegister && (
                <AuthField
                  icon={User}
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jane"
                  autoComplete="username"
                  required
                />
              )}
              <AuthField
                icon={Mail}
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
              <AuthField
                icon={Lock}
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={8}
                required
              />

              {error && (
                <p className="neu-pressed px-3 py-2 text-sm text-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="neu-primary flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold"
              >
                {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
                {!busy && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="mt-6 text-sm text-on-surface-variant">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  New to WebBot?{" "}
                  <Link href="/register" className="font-semibold text-primary hover:underline">
                    Create an account
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <BrandTile />
        <AuthFeatureTile
          icon={MousePointerClick}
          title="Visual node builder"
          description="Drag, drop and connect atomic actions into powerful browser automations."
        />
      </div>
    </main>
  );
}
