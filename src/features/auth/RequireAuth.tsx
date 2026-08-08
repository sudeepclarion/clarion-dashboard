import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api/endpoints";
import { isAuthenticated } from "@/lib/auth";

/**
 * When the backend has JWT_SECRET configured, require a session token.
 * When auth is not configured (local/open API), allow the app through.
 */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const [jwtRequired, setJwtRequired] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.dashboard
      .health()
      .then((health) => {
        if (cancelled) return;
        const auth = (health as { auth?: { jwt?: boolean } }).auth;
        setJwtRequired(Boolean(auth?.jwt));
      })
      .catch(() => {
        // Backend unreachable — let the dashboard shell show the connection error.
        if (!cancelled) setJwtRequired(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (jwtRequired === null) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (jwtRequired && !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
