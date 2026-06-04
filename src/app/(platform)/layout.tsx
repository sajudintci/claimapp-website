"use client";

import { PlatformAuthGuard } from "@/components/claimora/auth/auth-guard";
import { AppSidebar, TopNavbar } from "@/components/claimora/layout";
import { useCallback, useState } from "react";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed((v) => !v);
      return;
    }
    setMobileSidebarOpen((v) => !v);
  }, []);

  const handleCollapseToggle = useCallback(() => {
    setSidebarCollapsed((v) => !v);
  }, []);

  return (
    <PlatformAuthGuard>
      <div className="flex min-h-screen overflow-x-clip bg-background">
        <AppSidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggleCollapse={handleCollapseToggle}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar onSidebarToggle={handleSidebarToggle} />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </PlatformAuthGuard>
  );
}
