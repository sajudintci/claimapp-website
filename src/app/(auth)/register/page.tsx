import Link from "next/link";
import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { RegisterForm } from "@/components/claimora/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Aktifkan akses Sequis Anda melalui undangan dari tim asuransi."
      footer={
        <p>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
