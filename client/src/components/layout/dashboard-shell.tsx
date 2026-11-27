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
import { Avatar as AccountAvatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";
import { WorkspaceApiError } from "@/features/workspaces/api/workspace.api";
import { useWorkspaceDetails } from "@/features/workspaces/hooks/use-workspace-details";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { ProjectApiError } from "@/features/projects/api/project.api";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { TaskApiError } from "@/features/tasks/api/task.api";
import { useCreateTask } from "@/features/tasks/hooks/use-create-task";
import { useWorkspaceTaskOverview } from "@/features/tasks/hooks/use-workspace-task-overview";
import type { TaskPriority } from "@/features/tasks/types/task.types";
import { demoMembers, demoWorkspace } from "@/features/dashboard/api/demo-data";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/use-workspace-members";
import { Icon } from "@/components/shared/icon";

type ShellProps = { children: ReactNode };

const platformLinks = [
  { label: "Overview", icon: "grid" as const, href: "" },
  {
    label: "My tasks",
    icon: "check-circle" as const,
    href: "#my-tasks",
  },
  { label: "Projects", icon: "folder" as const, href: "/projects" },
  { label: "Members", icon: "users" as const, href: "/members" },
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
  const currentUserQuery = useCurrentUser();
  const logout = useLogout();
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
  const projectsQuery = useProjects(currentWorkspaceId, { page: 1, pageSize: 100, sort: "updated" });
  const taskOverviewQuery = useWorkspaceTaskOverview(currentWorkspaceId, Boolean(query));
  const membersQuery = useWorkspaceMembers(currentWorkspaceId);

  const searchResults = useMemo(() => {
    if (!query) return [];
    const projects = (projectsQuery.data?.projects ?? [])
      .filter((project) =>
        `${project.name} ${project.id}`.toLowerCase().includes(query),
      )
      .slice(0, 3)
      .map((project) => ({
        type: "Project",
        label: project.name,
        meta: `PRJ-${project.id.slice(0, 6).toUpperCase()}`,
        href: `/${workspaceSlug}/projects/${project.id}`,
      }));
    const tasks = (taskOverviewQuery.data?.tasks ?? [])
      .filter(({ task }) =>
        `${task.title} ${task.id}`.toLowerCase().includes(query),
      )
      .slice(0, 4)
      .map(({ task, project }) => ({
        type: "Task",
        label: task.title,
        meta: `#${task.id.slice(0, 8).toUpperCase()}`,
        href: `/${workspaceSlug}/tasks/${task.id}?projectId=${project.id}`,
      }));
    return [...projects, ...tasks];
  }, [projectsQuery.data?.projects, query, taskOverviewQuery.data?.tasks, workspaceSlug]);

  function navHref(href: string) {
    if (!href) return `/${workspaceSlug}`;
    if (href.startsWith("#")) return `/${workspaceSlug}${href}`;
    return `/${workspaceSlug}${href}`;
  }

  async function signOut() {
    if (logout.isPending) return;
    try {
      await logout.mutateAsync();
      router.replace("/");
      router.refresh();
    } catch {
      // useLogout reports failures and preserves the current session state.
    }
  }

  const currentProjectId = pathname.match(/\/projects\/([^/]+)/)?.[1];
  const currentProject = currentProjectId
    ? projectsQuery.data?.projects.find((project) => project.id === currentProjectId)
    : undefined;
  const pageTitle = pathname.includes("/projects")
    ? pathname.includes("/board")
      ? "Board"
      : (currentProject?.name ?? "Projects")
    : pathname.includes("/members")
      ? "Members"
      : pathname.includes("/activity")
        ? "Activity"
      : pathname.includes("/notifications")
        ? "Notifications"
        : "Workspace overview";

  useEffect(() => {
    if (currentUserQuery.isSuccess && currentUserQuery.data === null) {
      router.replace("/");
    }
  }, [currentUserQuery.data, currentUserQuery.isSuccess, router]);

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
      return;
    }
    if (projectsQuery.error instanceof ProjectApiError && projectsQuery.error.status === 401) {
      router.replace("/login");
      return;
    }
    if (taskOverviewQuery.error instanceof TaskApiError && taskOverviewQuery.error.status === 401) {
      router.replace("/login");
      return;
    }
    if (membersQuery.error instanceof WorkspaceApiError && membersQuery.error.status === 401) {
      router.replace("/login");
    }
  }, [
    currentWorkspaceId,
    membersQuery.error,
    projectsQuery.error,
    router,
    taskOverviewQuery.error,
    workspaceDetailsQuery.error,
    workspaceDetailsQuery.isError,
    workspacesQuery.error,
    workspacesQuery.isError,
    workspacesQuery.isSuccess,
  ]);

  if (currentUserQuery.isPending) {
    return <main className="workspace-route-state" role="status"><span className="workspace-spinner" aria-hidden="true" /><p>Checking your session…</p></main>;
  }
  if (currentUserQuery.isError) {
    return <main className="workspace-route-state" role="alert"><h1>Workspace unavailable</h1><p>We couldn’t verify your session. Try again.</p><button className="button button-secondary" type="button" onClick={() => void currentUserQuery.refetch()}>Try again</button></main>;
  }
  if (!currentUserQuery.data) {
    return <main className="workspace-route-state" role="status"><span className="workspace-spinner" aria-hidden="true" /><p>Returning to Nexora…</p></main>;
  }
  const currentUser = currentUserQuery.data;

  if (
    workspacesQuery.isError ||
    workspaceDetailsQuery.isError ||
    workspacesQuery.isPending ||
    workspaceDetailsQuery.isPending ||
    !activeWorkspace
  ) {
    // Keep the active route in the render tree while workspace chrome loads.
    // Route pages provide their own loading and error states.
    return <div className="workspace-content">{children}</div>;
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
          onNavigate={() => setMobileNavOpen(false)}
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
                  {item.label === "Projects" && projectsQuery.data && <span className="nav-count">{projectsQuery.data.pagination.total}</span>}
                  {item.label === "Members" && membersQuery.data && <span className="nav-count">{membersQuery.data.length}</span>}
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
            {(projectsQuery.data?.projects ?? []).slice(0, 4).map((project) => (
              <Link
                key={project.id}
                onClick={() => setMobileNavOpen(false)}
                className="recent-project"
                href={`/${workspaceSlug}/projects/${project.id}/board`}
              >
                <span className="project-dot blue" />
                <span>{project.name}</span>
              </Link>
            ))}
            {!projectsQuery.data?.projects.length && <span className="recent-project-empty">Projects will appear here.</span>}
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
          <DropdownMenuTrigger>
            <Button
              aria-label={`Open account menu for ${currentUser.name}`}
              className="profile-card"
              isDisabled={logout.isPending}
              variant="ghost"
            >
              <AccountAvatar className="dashboard-account-avatar">
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
              </AccountAvatar>
              <span className="profile-copy">
                <strong>{currentUser.name}</strong>
                <small>{logout.isPending ? "Signing out…" : currentUser.email}</small>
              </span>
            </Button>
            <DropdownMenu className="account-profile-menu" placement="top end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="account-profile-user-info">
                  <span className="account-profile-user-name">{currentUser.name}</span>
                  <span className="account-profile-user-email">{currentUser.email}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="account-profile-menu-item"
                onAction={() => router.push(`/${workspaceSlug}/settings`)}
              >
                <Icon aria-hidden="true" name="settings" size={16} /> Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="account-profile-menu-item"
                isDisabled={logout.isPending}
                onAction={() => void signOut()}
                variant="destructive"
              >
                <Icon aria-hidden="true" name="logout" size={16} />
                {logout.isPending ? "Signing out…" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenu>
          </DropdownMenuTrigger>
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
        <CreateTaskModal workspaceId={activeWorkspace.id} workspaceSlug={workspaceSlug} onClose={() => setCreateTaskOpen(false)} />
      )}
    </div>
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();
  return initials || "?";
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

function CreateTaskModal({ workspaceId, workspaceSlug, onClose }: { workspaceId: string; workspaceSlug: string; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState("");
  const projectsQuery = useProjects(workspaceId, { page: 1, pageSize: 100, sort: "updated" });
  const createTask = useCreateTask();
  const projects = projectsQuery.data?.projects ?? [];
  const selectedProjectId = projects.some((project) => project.id === projectId) ? projectId : projects[0]?.id ?? "";

  useEffect(() => {
    if (
      (createTask.error instanceof TaskApiError && createTask.error.status === 401) ||
      (projectsQuery.error instanceof ProjectApiError && projectsQuery.error.status === 401)
    ) router.replace("/login");
  }, [createTask.error, projectsQuery.error, router]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !createTask.isPending) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [createTask.isPending, onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !selectedProjectId) return;
    setFormError("");
    try {
      await createTask.mutateAsync({
        workspaceId,
        projectId: selectedProjectId,
        input: { title: title.trim(), priority, dueDate: dueDate || null },
      });
      toast.success("Task created");
      onClose();
    } catch (error) {
      setFormError(error instanceof TaskApiError ? error.message : "The task could not be created. Try again.");
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !createTask.isPending) onClose();
      }}
    >
      <section
        className="modal-card task-create-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">QUICK CAPTURE</span>
            <h2 id="new-task-title">Create a task</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={createTask.isPending} aria-label="Close">
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
              <Combobox
                ariaLabel="Task project"
                value={selectedProjectId}
                onValueChange={setProjectId}
                isDisabled={projectsQuery.isPending || projectsQuery.isError || projects.length === 0 || createTask.isPending}
                options={projects.map((project) => ({ value: project.id, label: project.name }))}
              />
            </label>
            <label className="field-label">
              Priority
              <Select
                ariaLabel="Task priority"
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
                isDisabled={createTask.isPending}
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "URGENT", label: "Urgent" },
                ]}
              />
            </label>
          </div>
          <label className="field-label">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={createTask.isPending}
            />
          </label>
          {projectsQuery.isPending && <p className="form-hint">Loading workspace projects…</p>}
          {projectsQuery.isError && <div className="workspace-form-alert" role="alert">{projectsQuery.error instanceof ProjectApiError ? projectsQuery.error.message : "Workspace projects could not be loaded."} <button type="button" className="inline-retry" onClick={() => void projectsQuery.refetch()}>Retry</button></div>}
          {!projectsQuery.isPending && !projectsQuery.isError && projects.length === 0 && <div className="workspace-form-alert" role="alert">Create a project before adding a task. <Link href={`/${workspaceSlug}/projects`}>Open projects</Link></div>}
          {formError && <p className="workspace-form-alert" role="alert">{formError}</p>}
          <div className="modal-footer">
            <span className="muted-note">Saved to your workspace</span>
            <button
              type="button"
              className="button button-quiet"
              onClick={onClose}
              disabled={createTask.isPending}
            >
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={!selectedProjectId || !title.trim() || createTask.isPending || projectsQuery.isError}>
              {createTask.isPending ? "Creating…" : <><Icon name="plus" size={16} /> Create task</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
