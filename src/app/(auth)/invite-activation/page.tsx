import Link from "next/link";
import { AuthShell } from "@/components/claimora/auth/auth-shell";

export default function InviteActivationPage() {
  return (
    <AuthShell
      title="Invitation verified"
      description="Your invite link is valid. Continue to set up your account."
      footer={
        <Link href="/register" className="font-medium text-primary hover:text-primary-hover">
          Continue registration →
        </Link>
      }
    >
      <div className="space-y-4 text-sm text-slate-600">
        <p>
          Insurance Admin invited you to Sequis. Complete registration to activate your account.
        </p>
        <Link
          href="/register"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Continue to registration
        </Link>
      </div>
    </AuthShell>
  );
}
