import Link from "next/link";
import { AuthShell } from "@/components/claimora/auth/auth-shell";

export default function UnauthorizedPage() {
  return (
    <AuthShell
      title="Unauthorized access"
      description="Your role does not have permission to access this module."
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Contact your insurance administrator if you believe this is an error.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Go to dashboard
        </Link>
        <Link
          href="/login"
          className="block text-center text-sm text-blue-600 hover:text-blue-700"
        >
          Sign in with another account
        </Link>
      </div>
    </AuthShell>
  );
}
