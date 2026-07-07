import { Suspense } from "react";
import { UsersManagementPage } from "@/components/user-management/users-management-page";

export default function UserManagementPageRoute() {
  return (
    <Suspense fallback={null}>
      <UsersManagementPage />
    </Suspense>
  );
}
