"use client";
import { useRequireAuth } from "@/contexts/auth";

export default function ApeLayout({ children }) {
  const { isLoading: authLoading } = useRequireAuth();

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Auth check passed, render children
  return <>{children}</>;
}
