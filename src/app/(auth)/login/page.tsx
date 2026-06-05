import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { LoginForm } from "@/components/claimora/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      variant="login"
      title="Selamat datang kembali"
      description="Masuk dengan akun Anda untuk mengelola klaim, meninjau dokumen, dan melacak aktivitas dengan mudah."
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
