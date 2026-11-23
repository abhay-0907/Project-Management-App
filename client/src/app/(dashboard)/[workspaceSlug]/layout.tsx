import type { ReactNode } from "react";
import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="workspace-route-state" role="status">
          <span className="workspace-spinner" aria-hidden="true" />
          <p>Loading workspace</p>
        </div>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
