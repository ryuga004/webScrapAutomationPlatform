"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

/** State + submit handling for the login / register screens. */
export function useAuthForm(mode: "login" | "register") {
  const { status, login, register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  // Already signed in → go to the dashboard.
  useEffect(() => {
    if (status === "authenticated") router.replace("/workflows");
  }, [status, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) await register(username, email, password);
      else await login(email, password);
      router.replace("/workflows");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return {
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
  };
}
