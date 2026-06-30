import Link from "next/link";
import { AuthShell } from "@/components/claimora/auth/auth-shell";
import { RegisterForm } from "@/components/claimora/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
<<<<<<< HEAD
      description="Aktifkan akses Sequis Anda melalui undangan dari tim asuransi."
      footer={
        <p>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
=======
      description="Activate your Sequis access using your insurance invitation."
      footer={
        <p>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
