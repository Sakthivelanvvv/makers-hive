import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ErpShell } from "@/components/erp-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: "/auth", replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return null;
  }

  return (
    <ErpShell>
      <Outlet />
    </ErpShell>
  );
}
