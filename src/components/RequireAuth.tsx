"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

// Client-side guard: renders children only for authenticated users, otherwise
// redirects to /login. Wrap protected pages with this.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface-variant">
        {status === "loading" ? "Loading…" : "Redirecting to sign in…"}
      </div>
    );
  }
  return <>{children}</>;
}
