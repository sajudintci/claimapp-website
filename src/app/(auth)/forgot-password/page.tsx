import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/claimora/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      description="We'll send a secure reset link to your work email."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
