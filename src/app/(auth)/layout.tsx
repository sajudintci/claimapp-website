import { GuestAuthGuard } from "@/components/claimora/auth/auth-guard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GuestAuthGuard>{children}</GuestAuthGuard>;
}
