import { MockCredential } from "@/types/auth";

export const MOCK_USERS: MockCredential[] = [
  {
    id: "USR-SUPER-ADMIN",
    name: "Super Admin",
    email: "superadmin@claimora.local",
    password: "SuperAdmin123!",
    role: "Super Admin",
    department: "Operations",
    initials: "SA",
  },
];

export function findMockUser(email: string, password: string) {
  return MOCK_USERS.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase().trim() && user.password === password,
  );
}
