"use client";
import { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import axios from "axios";

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

async function getSession() {
  return (await axios.get("/api/session")).data;
}

// Non-redirecting auth provider - just provides session data
export function AuthProvider({ children }) {
  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
}

// Optional: Use this hook in protected pages to handle invalid sessions
export function useRequireAuth() {
  const pathname = usePathname();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    // If session loaded and user is not authenticated, redirect to login
    if (!isLoading && session && !session.authenticated) {
      window.location.href = `/api/login?destination=${encodeURIComponent(pathname)}`;
    }
  }, [session, isLoading, pathname]);

  return { session, isLoading };
}
