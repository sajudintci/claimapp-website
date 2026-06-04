import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { LoginForm } from "@/components/claimora/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      variant="login"
      title="Welcome back"
      description="Sign in with your insurance credentials to access claim intelligence, document review, and audit tools."
      footer={
        <p>
          Invited by your organization?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            Complete registration
          </Link>
        </p>
      }
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
