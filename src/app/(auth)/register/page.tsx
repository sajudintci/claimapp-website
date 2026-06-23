import Link from "next/link";
import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { RegisterForm } from "@/components/claimora/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Activate your Sequis access using your insurance invitation."
      footer={
        <p>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
