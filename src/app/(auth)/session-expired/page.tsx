import Link from "next/link";
import { AuthShell } from "@/components/claimora/auth/auth-shell";

export default function SessionExpiredPage() {
  return (
    <AuthShell
      title="Session expired"
      description="Your secure session has ended. Please sign in again."
    >
      <Link
        href="/login"
<<<<<<< HEAD
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-dark"
=======
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
      >
        Back to sign in
      </Link>
    </AuthShell>
  );
}
