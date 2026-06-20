import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Factory } from "lucide-react";
import { useAuth, SignIn, SignUp } from "@clerk/clerk-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Forge ERP" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-5xl rounded-2xl p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-primary/15 p-2.5">
            <Factory className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Forge ERP</h1>
            <p className="text-xs text-muted-foreground">Manufacturing operations platform</p>
          </div>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="pt-6">
            <div className="mx-auto max-w-md">
              <SignIn routing="hash" signUpUrl="#signup" />
            </div>
          </TabsContent>

          <TabsContent value="signup" className="pt-6">
            <div className="mx-auto max-w-md">
              <SignUp routing="hash" signInUrl="#login" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
