import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { ResetPasswordForm } from "@/components/claimora/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="Choose a new password to continue secure claim operations."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
