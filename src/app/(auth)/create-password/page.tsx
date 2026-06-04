import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { ResetPasswordForm } from "@/components/claimora/auth/reset-password-form";

export default function CreatePasswordPage() {
  return (
    <AuthShell
      title="Create password"
      description="Set your password to finish account activation. Public signup is not available."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
