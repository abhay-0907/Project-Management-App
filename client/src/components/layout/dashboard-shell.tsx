"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";
import { WorkspaceApiError } from "@/features/workspaces/api/workspace.api";
import { useWorkspaceDetails } from "@/features/workspaces/hooks/use-workspace-details";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import {
  demoMembers,
  demoProjects,
  demoTasks,
  demoWorkspace,
  getProject,
} from "@/features/dashboard/api/demo-data";
import { Icon } from "@/components/shared/icon";

type ShellProps = { children: ReactNode };

const platformLinks = [
  { label: "Overview", icon: "grid" as const, href: "" },
  {
    label: "My tasks",
    icon: "check-circle" as const,
    href: "#my-tasks",
    badge: "4",
  },
  { label: "Projects", icon: "folder" as const, href: "/projects", badge: "6" },
  { label: "Members", icon: "users" as const, href: "/members", badge: "7" },
  {
    label: "Notifications",
    icon: "bell" as const,
    href: "/notifications",
    dot: true,
  },
];

const workspaceLinks = [
  { label: "All projects", icon: "board" as const, href: "/projects" },
  {
    label: "Active projects",
    icon: "bolt" as const,
    href: "/projects?status=ACTIVE",
  },
  {
    label: "Archived",
    icon: "archive" as const,
    href: "/projects?status=ARCHIVED",
  },
];

export function DashboardShell({ children }: ShellProps) {
  const params = useParams<{ workspaceSlug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug || demoWorkspace.slug;
  const workspacesQuery = useWorkspaces();
  const currentWorkspace = workspacesQuery.data?.find(
    (workspace) => workspace.slug === workspaceSlug,
  );
  const currentWorkspaceId = currentWorkspace?.id;
  const workspaceDetailsQuery = useWorkspaceDetails(currentWorkspaceId);
  const activeWorkspace = workspaceDetailsQuery.data ?? currentWorkspace;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const query = search.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!query) return [];
    const projects = demoProjects
      .filter((project) =>
        `${project.name} ${project.code}`.toLowerCase().includes(query),
      )
      .slice(0, 3)
      .map((project) => ({
        type: "Project",
        label: project.name,
        meta: project.code,
        href: `/${workspaceSlug}/projects/${project.id}`,
      }));
    const tasks = demoTasks
      .filter((task) =>
        `${task.title} ${task.key}`.toLowerCase().includes(query),
      )
      .slice(0, 4)
      .map((task) => ({
        type: "Task",
        label: task.title,
        meta: task.key,
        href: `/${workspaceSlug}/tasks/${task.id}`,
      }));
    return [...projects, ...tasks];
  }, [query, workspaceSlug]);

  function navHref(href: string) {
    if (!href) return `/${workspaceSlug}`;
    if (href.startsWith("#")) return `/${workspaceSlug}${href}`;
    return `/${workspaceSlug}${href}`;
  }

  const currentProjectId = pathname.match(/\/projects\/([^/]+)/)?.[1];
  const currentProject = currentProjectId
    ? demoProjects.find((project) => project.id === currentProjectId)
    : undefined;
  const pageTitle = pathname.includes("/projects")
    ? pathname.includes("/board")
      ? "Board"
      : (currentProject?.name ?? "Projects")
    : pathname.includes("/members")
      ? "Members"
      : pathname.includes("/notifications")
        ? "Notifications"
        : "Workspace overview";

  useEffect(() => {
    if (workspacesQuery.isError) {
      const destination =
        workspacesQuery.error instanceof WorkspaceApiError &&
        workspacesQuery.error.status === 401
          ? "/login"
          : "/workspaces";
      router.replace(destination);
      return;
    }
    if (workspacesQuery.isSuccess && !currentWorkspaceId) {
      router.replace("/workspaces");
      return;
    }
    if (workspaceDetailsQuery.isError) {
      const destination =
        workspaceDetailsQuery.error instanceof WorkspaceApiError &&
        workspaceDetailsQuery.error.status === 401
          ? "/login"
          : "/workspaces";
      router.replace(destination);
    }
  }, [
    currentWorkspaceId,
    router,
    workspaceDetailsQuery.error,
    workspaceDetailsQuery.isError,
    workspacesQuery.error,
    workspacesQuery.isError,
    workspacesQuery.isSuccess,
  ]);

  if (
    workspacesQuery.isError ||
    workspaceDetailsQuery.isError ||
    workspacesQuery.isPending ||
    workspaceDetailsQuery.isPending ||
    !activeWorkspace
  ) {
    return (
      <main className="workspace-route-state" role="status" aria-live="polite">
        <span className="workspace-spinner" aria-hidden="true" />
        <p>Opening your workspace…</p>
      </main>
    );
  }

  return (
    <div className="workspace-app">
      <button
        className={`mobile-scrim ${mobileNavOpen ? "is-visible" : ""}`}
        aria-label="Close navigation"
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className={`workspace-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="brand-row">
          <Link
            className="brand-mark"
            href={`/${workspaceSlug}`}
            aria-label="Nexora home"
          >
            <span className="brand-symbol">n</span>
            <span>Nexora</span>
          </Link>
          <span className="plan-pill">TEAM</span>
          <button
            className="icon-button collapse-button"
            aria-label="Toggle navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <Icon name="menu" />
          </button>
        </div>

        <WorkspaceSwitcher
          activeWorkspace={activeWorkspace}
          workspaces={workspacesQuery.data ?? []}
        />

        <div className="sidebar-scroll">
          <p className="nav-label">Workspace</p>
          <nav className="side-nav" aria-label="Primary navigation">
            {platformLinks.map((item) => {
              const href = navHref(item.href);
              const active =
                item.label === "Overview"
                  ? pathname === `/${workspaceSlug}`
                  : item.label === "Projects"
                    ? pathname.includes("/projects")
                    : item.label === "Members"
                      ? pathname.includes("/members")
                      : item.label === "Notifications"
                        ? pathname.includes("/notifications")
                        : false;
              return (
                <Link
                  key={item.label}
                  onClick={() => setMobileNavOpen(false)}
                  className={`side-link ${active ? "is-active" : ""}`}
                  href={href}
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="nav-count">{item.badge}</span>
                  )}
                  {item.dot && <span className="nav-dot" />}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-divider" />
          <div className="nav-heading-row">
            <p className="nav-label">Project space</p>
            <button
              className="tiny-icon-button"
              aria-label="Create a project"
              onClick={() => router.push(`/${workspaceSlug}/projects`)}
            >
              <Icon name="plus" size={15} />
            </button>
          </div>
          <nav className="side-nav" aria-label="Project navigation">
            {workspaceLinks.map((item) => (
              <Link
                key={item.label}
                onClick={() => setMobileNavOpen(false)}
                className={`side-link ${item.label === "All projects" && pathname.endsWith("/projects") && !pathname.includes("/board") ? "is-active" : ""}`}
                href={navHref(item.href)}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-divider" />
          <div className="nav-heading-row">
            <p className="nav-label">Recently viewed</p>
            <button className="tiny-icon-button" aria-label="More options">
              <Icon name="more" size={15} />
            </button>
          </div>
          <nav className="recent-projects" aria-label="Recent projects">
            {demoProjects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                onClick={() => setMobileNavOpen(false)}
                className="recent-project"
                href={`/${workspaceSlug}/projects/${project.id}/board`}
              >
                <span className={`project-dot ${project.accent}`} />
                <span>{project.name.replace("Nexora ", "")}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <Link
            onClick={() => setMobileNavOpen(false)}
            className="side-link"
            href={`/${workspaceSlug}/settings`}
          >
            <Icon name="settings" size={17} />
            <span>Settings</span>
          </Link>
          <button
            className="side-link support-link"
            onClick={() =>
              toast.message("Help center", {
                description: "Guides and support links will be available here.",
              })
            }
          >
            <Icon name="help" size={17} />
            <span>Help & support</span>
          </button>
          <div className="profile-card">
            <Avatar member={demoMembers[0]} size="md" />
            <div className="profile-copy">
              <strong>{demoMembers[0].name}</strong>
              <small>{demoMembers[0].email}</small>
            </div>
            <button
              className="tiny-icon-button"
              aria-label="Profile options"
              onClick={() =>
                toast.message("Profile menu", {
                  description: "Account settings and sign out options.",
                })
              }
            >
              <Icon name="more" size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="topbar-leading">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <div className="breadcrumbs">
              <span>{activeWorkspace.name}</span>
              <Icon name="chevron-right" size={14} />
              <strong>{pageTitle}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="global-search-wrap">
              <Icon name="search" size={17} />
              <input
                aria-label="Search projects and tasks"
                placeholder="Search anything..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearch("");
                  if (event.key === "Enter" && searchResults[0])
                    router.push(searchResults[0].href);
                }}
              />
              <kbd>⌘ K</kbd>
              {query && (
                <div className="search-results">
                  {searchResults.length ? (
                    searchResults.map((result) => (
                      <Link
                        href={result.href}
                        key={`${result.type}-${result.meta}`}
                        onClick={() => setSearch("")}
                      >
                        <span className="search-result-type">
                          {result.type === "Task" ? (
                            <Icon name="check-circle" size={15} />
                          ) : (
                            <Icon name="folder" size={15} />
                          )}
                        </span>
                        <span className="search-result-copy">
                          <strong>{result.label}</strong>
                          <small>
                            {result.type} · {result.meta}
                          </small>
                        </span>
                        <Icon name="arrow-up-right" size={14} />
                      </Link>
                    ))
                  ) : (
                    <p className="search-empty">
                      No matching projects or tasks.
                    </p>
                  )}
                </div>
              )}
            </div>
            <span className="presence-pill">
              <span />
              Online
            </span>
            <Link
              className="topbar-icon-button notification-trigger"
              href={`/${workspaceSlug}/notifications`}
              aria-label="Notifications"
            >
              <Icon name="bell" size={18} />
              <i />
            </Link>
            <button
              className="button button-primary top-create"
              onClick={() => setCreateTaskOpen(true)}
            >
              <Icon name="plus" size={17} />
              <span>New task</span>
            </button>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>

      {createTaskOpen && (
        <CreateTaskModal onClose={() => setCreateTaskOpen(false)} />
      )}
    </div>
  );
}

export function Avatar({
  member,
  size = "sm",
  showName = false,
}: {
  member?: (typeof demoMembers)[number];
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  if (!member)
    return <span className={`avatar avatar-${size} avatar-empty`}>?</span>;
  return (
    <span className="avatar-wrap">
      {" "}
      <span
        className={`avatar avatar-${size}`}
        style={{ backgroundColor: member.color }}
      >
        {member.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </span>
      {showName && <span className="avatar-name">{member.name}</span>}
    </span>
  );
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(demoProjects[0].id);
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    const project = getProject(projectId);
    toast.success("Task draft created", {
      description: `${title.trim()} · ${project.name}`,
    });
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">QUICK CAPTURE</span>
            <h2 id="new-task-title">Create a task</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <label className="field-label">
            Task title
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to get done?"
              required
            />
          </label>
          <div className="form-grid-two">
            <label className="field-label">
              Project
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                {demoProjects
                  .filter((project) => project.status === "ACTIVE")
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field-label">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
          </div>
          <label className="field-label">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
          <div className="modal-footer">
            <span className="muted-note">Saved to this demo session</span>
            <button
              type="button"
              className="button button-quiet"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              <Icon name="plus" size={16} /> Create task
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
