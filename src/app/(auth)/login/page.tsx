import { Suspense } from "react";
import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { LoginForm } from "@/components/claimora/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      variant="login"
      title="Welcome back"
      description="Sign in with your insurance credentials to access claim intelligence, document review, and audit tools."
    >
      <Suspense
        fallback={
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading sign in...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
