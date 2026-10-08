"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/client";

export type Me = { id: string; name: string; email: string; role: "super_admin" | "admin" | "editor"; lastLoginAt?: string };

const Ctx = createContext<{ me: Me | null; reload: () => Promise<void> }>({ me: null, reload: async () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const reload = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: Me }>("/auth/me");
      setMe(data.user);
    } catch {
      /* 401 handled by interceptor */
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return <Ctx.Provider value={{ me, reload }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);

export const can = (me: Me | null, action: "manage" | "super") =>
  !!me && (action === "super" ? me.role === "super_admin" : me.role !== "editor");
