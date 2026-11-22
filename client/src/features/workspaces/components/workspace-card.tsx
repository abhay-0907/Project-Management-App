import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import type { Workspace } from "../types/workspace.types";

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <article className="workspace-choice-card">
      <span className="workspace-choice-monogram" aria-hidden="true">
        {workspace.name.trim().charAt(0).toUpperCase() || "W"}
      </span>
      <div className="workspace-choice-copy">
        <h2>{workspace.name}</h2>
        <p>nexora.app/{workspace.slug}</p>
      </div>
      <span className={`workspace-role-pill role-${workspace.role.toLowerCase()}`}>
        {workspace.role.toLowerCase()}
      </span>
      <Link
        href={`/${workspace.slug}`}
        className="button button-secondary workspace-open-button"
        aria-label={`Open ${workspace.name}`}
      >
        Open workspace <Icon name="arrow-right" size={15} />
      </Link>
    </article>
  );
}
