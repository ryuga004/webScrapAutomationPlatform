"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

type Status = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  /** fetch() wrapper that attaches the bearer token and logs out on 401. */
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const TOKEN_KEY = "webbot.token";
const AuthContext = createContext<AuthContextValue | null>(null);

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const tokenRef = useRef<string | null>(null);

  const setSession = useCallback((t: string | null, u: PublicUser | null) => {
    tokenRef.current = t;
    setToken(t);
    setUser(u);
    setStatus(u ? "authenticated" : "anonymous");
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const logout = useCallback(() => setSession(null, null), [setSession]);

  // Restore a session from a stored token on first load. All state updates run
  // inside the async closure (after an await) so this stays a proper "sync with
  // an external system" effect rather than a synchronous cascading render.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      const stored =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (!stored) {
        if (!cancelled) setStatus("anonymous");
        return;
      }
      tokenRef.current = stored;
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (!res.ok) throw new Error("expired");
        const data = await res.json();
        if (!cancelled) setSession(stored, data.user);
      } catch {
        if (!cancelled) setSession(null, null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      setSession(data.token, data.user);
    },
    [setSession],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      setSession(data.token, data.user);
    },
    [setSession],
  );

  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (tokenRef.current) {
        headers.set("Authorization", `Bearer ${tokenRef.current}`);
      }
      const res = await fetch(input, { ...init, headers });
      if (res.status === 401) logout();
      return res;
    },
    [logout],
  );

  const value = useMemo(
    () => ({ user, token, status, login, register, logout, authFetch }),
    [user, token, status, login, register, logout, authFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
