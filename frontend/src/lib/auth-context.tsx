"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, clearTokens, setTokens } from "./api";
import { CurrentUser, Organization } from "./types";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (organizationSlug: string, email: string, password: string) => Promise<void>;
  register: (input: {
    organizationName: string;
    organizationSlug: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<Organization>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchUser = useCallback(async () => {
    try {
      const me = await apiFetch<CurrentUser>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && localStorage.getItem("accessToken");
    if (hasToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring session on mount
      refetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refetchUser]);

  const login = useCallback(
    async (organizationSlug: string, email: string, password: string) => {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ organizationSlug, email, password }),
      });
      setTokens(data.accessToken, data.refreshToken);
      await refetchUser();
    },
    [refetchUser],
  );

  const register = useCallback(
    async (input: {
      organizationName: string;
      organizationSlug: string;
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => {
      const data = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        organization: Organization;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setTokens(data.accessToken, data.refreshToken);
      await refetchUser();
      return data.organization;
    },
    [refetchUser],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, hasPermission, refetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
