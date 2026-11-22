export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export type ProjectLifecycle = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type DemoWorkspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type DemoMember = {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
  color: string;
};

export type DemoProject = {
  id: string;
  code: string;
  workspaceId: string;
  name: string;
  description: string;
  createdBy: string;
  startDate: string;
  dueDate: string;
  status: ProjectLifecycle;
  updatedAt: string;
  accent: string;
  icon: "palette" | "database" | "mobile" | "shield" | "brackets" | "key";
};

export type DemoProjectStatus = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  position: number;
  color: string;
  isDefault: boolean;
  isCompleted: boolean;
};

export type DemoTask = {
  id: string;
  key: string;
  workspaceId: string;
  projectId: string;
  statusId: string;
  parentTaskId: string | null;
  title: string;
  description: string;
  assigneeId: string | null;
  createdBy: string;
  priority: TaskPriority;
  position: number;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  updatedAt: string;
  labels: string[];
};

export type DemoComment = {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
};

export type DemoAttachment = {
  id: string;
  taskId: string;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
};

export type DemoActivity = {
  id: string;
  actorId: string;
  entityType: "project" | "task" | "member";
  action: string;
  message: string;
  createdAt: string;
};

export type DemoNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export const demoWorkspace: DemoWorkspace = {
  id: "ws_acme",
  name: "Acme Engineering",
  slug: "acme-engineering",
  createdAt: "2025-02-14T09:00:00.000Z",
};

export const demoMembers: DemoMember[] = [
  { id: "u_elena", name: "Elena Vance", email: "elena@acme.io", role: "ADMIN", joinedAt: "2025-02-14", color: "#2775a6" },
  { id: "u_marcus", name: "Marcus Vance", email: "marcus@acme.io", role: "OWNER", joinedAt: "2025-02-14", color: "#a45c46" },
  { id: "u_sarah", name: "Sarah Lin", email: "sarah@acme.io", role: "MEMBER", joinedAt: "2025-03-02", color: "#6559a5" },
  { id: "u_david", name: "David Kim", email: "david@acme.io", role: "MEMBER", joinedAt: "2025-03-18", color: "#34836e" },
  { id: "u_jules", name: "Jules Weber", email: "jules@acme.io", role: "MEMBER", joinedAt: "2025-04-01", color: "#c17b30" },
  { id: "u_amina", name: "Amina Patel", email: "amina@acme.io", role: "MEMBER", joinedAt: "2025-04-12", color: "#bc6477" },
  { id: "u_omar", name: "Omar Reyes", email: "omar@acme.io", role: "MEMBER", joinedAt: "2025-05-06", color: "#456ca8" },
];

export const demoProjects: DemoProject[] = [
  {
    id: "prj_design", code: "NX-DS", workspaceId: demoWorkspace.id, name: "Nexora Design System 2.0",
    description: "A shared design language for product teams: accessible tokens, flexible components, and dependable patterns.",
    createdBy: "u_marcus", startDate: "2026-08-18", dueDate: "2026-12-04", status: "ACTIVE", updatedAt: "2026-11-20T13:45:00.000Z", accent: "blue", icon: "palette",
  },
  {
    id: "prj_engine", code: "ENG-MIG", workspaceId: demoWorkspace.id, name: "Core Engine v3 Migration",
    description: "Move event processing to the new streaming runtime with measured latency and a safe rollout plan.",
    createdBy: "u_elena", startDate: "2026-09-01", dueDate: "2026-12-18", status: "ACTIVE", updatedAt: "2026-11-20T12:10:00.000Z", accent: "violet", icon: "database",
  },
  {
    id: "prj_mobile", code: "APP-IOS", workspaceId: demoWorkspace.id, name: "Mobile App Redesign",
    description: "Bring the mobile experience up to date with a faster, more consistent navigation model.",
    createdBy: "u_sarah", startDate: "2026-07-24", dueDate: "2026-12-12", status: "ACTIVE", updatedAt: "2026-11-19T15:20:00.000Z", accent: "green", icon: "mobile",
  },
  {
    id: "prj_security", code: "SEC-24", workspaceId: demoWorkspace.id, name: "SOC 2 Readiness",
    description: "Close audit gaps and document the operational controls needed for the next review.",
    createdBy: "u_elena", startDate: "2026-10-03", dueDate: "2027-01-30", status: "ON_HOLD", updatedAt: "2026-11-16T10:02:00.000Z", accent: "orange", icon: "shield",
  },
  {
    id: "prj_api", code: "API-PLT", workspaceId: demoWorkspace.id, name: "Public API & Developer Platform",
    description: "Improve API onboarding with a coherent reference, examples, and dependable tooling.",
    createdBy: "u_marcus", startDate: "2026-09-12", dueDate: "2027-01-20", status: "ACTIVE", updatedAt: "2026-11-18T17:34:00.000Z", accent: "cyan", icon: "brackets",
  },
  {
    id: "prj_sso", code: "ID-SSO", workspaceId: demoWorkspace.id, name: "Enterprise SSO Integration",
    description: "A clear setup path for enterprise identity providers and workspace access policies.",
    createdBy: "u_david", startDate: "2026-08-01", dueDate: "2026-11-14", status: "COMPLETED", updatedAt: "2026-11-14T16:10:00.000Z", accent: "rose", icon: "key",
  },
];

const statusRows: Array<[string, string, number, string, boolean, boolean]> = [
  ["backlog", "Backlog", 0, "#a9a8b5", false, false],
  ["todo", "To do", 1, "#797b8a", true, false],
  ["in-progress", "In progress", 2, "#4a8ee8", false, false],
  ["in-review", "In review", 3, "#bc8a42", false, false],
  ["done", "Done", 4, "#35a27b", false, true],
];

export const demoStatuses: DemoProjectStatus[] = demoProjects.flatMap((project) =>
  statusRows.map(([slug, name, position, color, isDefault, isCompleted]) => ({
    id: `${project.id}_${slug}`,
    projectId: project.id,
    name,
    slug,
    position,
    color,
    isDefault,
    isCompleted,
  })),
);

const taskRows: Array<{
  id: string; projectId: string; status: string; title: string; description: string;
  assignee: string | null; priority: DemoTask["priority"]; dueDate: string | null; labels?: string[];
  parentTaskId?: string | null; updatedAt?: string;
}> = [
  { id: "DS-108", projectId: "prj_design", status: "backlog", title: "Audit color contrast across core components", description: "Review the shared component set against WCAG AA and capture any token-level fixes before release.", assignee: "u_amina", priority: "HIGH", dueDate: "2026-11-27", labels: ["Accessibility", "Design system"] },
  { id: "DS-112", projectId: "prj_design", status: "backlog", title: "Document token export workflow", description: "Add a concise guide for exporting theme tokens and validating them in downstream apps.", assignee: "u_jules", priority: "MEDIUM", dueDate: "2026-12-02", labels: ["Documentation"] },
  { id: "DS-94", projectId: "prj_design", status: "todo", title: "Refine focus treatment for dialog patterns", description: "Align focus rings, trap behavior, and escape handling across the dialog family.", assignee: "u_sarah", priority: "HIGH", dueDate: "2026-11-25", labels: ["Components", "Accessibility"] },
  { id: "DS-99", projectId: "prj_design", status: "todo", title: "Publish design token reference page", description: "Create a searchable reference for color, spacing, typography, and motion tokens.", assignee: "u_david", priority: "MEDIUM", dueDate: "2026-11-28", labels: ["Docs"] },
  { id: "DS-82", projectId: "prj_design", status: "in-progress", title: "Build theme variable generator", description: "Create a runtime-safe generator that maps design tokens into CSS custom properties for each workspace theme.", assignee: "u_elena", priority: "URGENT", dueDate: "2026-11-24", labels: ["Engineering", "Theming"] },
  { id: "DS-85", projectId: "prj_design", status: "in-progress", title: "Specify interaction states for buttons", description: "Document hover, pressed, focus, disabled, and loading states for the button family.", assignee: "u_omar", priority: "HIGH", dueDate: "2026-11-29", labels: ["Components"] },
  { id: "DS-83", projectId: "prj_design", status: "in-progress", title: "Add semantic aliases for status colors", description: "Create semantic status colors that remain readable in both light and dark themes.", assignee: "u_amina", priority: "MEDIUM", dueDate: "2026-11-26", labels: ["Theming"] },
  { id: "DS-76", projectId: "prj_design", status: "in-review", title: "Review navigation spacing tokens", description: "Check compact and expanded navigation spacing across desktop and tablet breakpoints.", assignee: "u_jules", priority: "LOW", dueDate: "2026-11-23", labels: ["Review"] },
  { id: "DS-71", projectId: "prj_design", status: "done", title: "Set up component contribution guide", description: "Publish ownership, review, and versioning guidance for shared components.", assignee: "u_marcus", priority: "MEDIUM", dueDate: "2026-11-18", labels: ["Docs"] },
  { id: "DS-82A", projectId: "prj_design", status: "todo", title: "Add theme preview fixtures", description: "Prepare sample themes for generator validation.", assignee: "u_elena", priority: "LOW", dueDate: "2026-11-30", labels: ["Theming"], parentTaskId: "DS-82" },
  { id: "ENG-88", projectId: "prj_engine", status: "in-progress", title: "Review partition strategy for event streams", description: "Compare traffic patterns and propose shard keys for the next migration step.", assignee: "u_david", priority: "URGENT", dueDate: "2026-11-24", labels: ["Platform", "Performance"] },
  { id: "ENG-91", projectId: "prj_engine", status: "todo", title: "Add replay tooling to staging", description: "Allow engineers to replay a bounded event window in staging for regression checks.", assignee: "u_omar", priority: "HIGH", dueDate: "2026-12-01", labels: ["Tooling"] },
  { id: "ENG-73", projectId: "prj_engine", status: "in-review", title: "Define migration health checks", description: "Add clear checks for lag, retries, and worker saturation during rollout.", assignee: "u_marcus", priority: "MEDIUM", dueDate: "2026-11-26", labels: ["Observability"] },
  { id: "APP-42", projectId: "prj_mobile", status: "in-progress", title: "Prototype offline-first sync flow", description: "Test conflict handling and recovery states for users returning to a connection.", assignee: "u_sarah", priority: "HIGH", dueDate: "2026-11-30", labels: ["Mobile", "Research"] },
  { id: "APP-36", projectId: "prj_mobile", status: "done", title: "Map the new navigation model", description: "Capture the updated information architecture and entry points.", assignee: "u_amina", priority: "MEDIUM", dueDate: "2026-11-15", labels: ["UX"] },
  { id: "SEC-14", projectId: "prj_security", status: "todo", title: "Collect access review evidence", description: "Gather workspace and service access reviews for the audit evidence folder.", assignee: "u_elena", priority: "HIGH", dueDate: "2026-12-06", labels: ["Audit"] },
  { id: "API-27", projectId: "prj_api", status: "in-progress", title: "Add request examples to API reference", description: "Provide copyable examples for the most common integration paths.", assignee: "u_jules", priority: "MEDIUM", dueDate: "2026-12-08", labels: ["Developer experience"] },
  { id: "API-31", projectId: "prj_api", status: "backlog", title: "Improve key rotation guidance", description: "Explain key lifecycle and rotation recommendations for workspace admins.", assignee: "u_david", priority: "LOW", dueDate: "2026-12-16", labels: ["Security", "Docs"] },
  { id: "ID-19", projectId: "prj_sso", status: "done", title: "Validate SAML sign-in flow", description: "Complete the end-to-end sign-in check for the supported identity providers.", assignee: "u_david", priority: "HIGH", dueDate: "2026-11-12", labels: ["Identity"] },
];

export const demoTasks: DemoTask[] = taskRows.map((row, index) => ({
  id: row.id,
  key: row.id.replace("A", "-SUB"),
  workspaceId: demoWorkspace.id,
  projectId: row.projectId,
  statusId: `${row.projectId}_${row.status}`,
  parentTaskId: row.parentTaskId ?? null,
  title: row.title,
  description: row.description,
  assigneeId: row.assignee,
  createdBy: "u_marcus",
  priority: row.priority,
  position: index + 1,
  startDate: null,
  dueDate: row.dueDate,
  completedAt: row.status === "done" ? "2026-11-18T14:00:00.000Z" : null,
  updatedAt: row.updatedAt ?? `2026-11-${String(20 - (index % 5)).padStart(2, "0")}T10:00:00.000Z`,
  labels: row.labels ?? [],
}));

export const demoComments: DemoComment[] = [
  { id: "c_1", taskId: "DS-82", authorId: "u_sarah", content: "The variable naming looks good. I left a couple of edge cases in the review notes for high contrast themes.", createdAt: "2026-11-20T11:24:00.000Z" },
  { id: "c_2", taskId: "DS-82", authorId: "u_elena", content: "Thanks — I’ll add those cases to the preview fixtures before the next handoff.", createdAt: "2026-11-20T13:08:00.000Z" },
  { id: "c_3", taskId: "DS-82", authorId: "u_marcus", content: "Nice progress. Please include a short note about how projects can opt into the new theme.", createdAt: "2026-11-21T08:42:00.000Z" },
  { id: "c_4", taskId: "DS-94", authorId: "u_omar", content: "I tested the focus loop in the settings flow. It now returns to the trigger as expected.", createdAt: "2026-11-20T09:15:00.000Z" },
];

export const demoAttachments: DemoAttachment[] = [
  { id: "a_1", taskId: "DS-82", uploadedBy: "u_elena", fileName: "theme-variable-map.pdf", mimeType: "application/pdf", fileSize: 1_420_000, createdAt: "2026-11-19T16:20:00.000Z" },
  { id: "a_2", taskId: "DS-82", uploadedBy: "u_sarah", fileName: "preview-states.png", mimeType: "image/png", fileSize: 840_000, createdAt: "2026-11-20T10:02:00.000Z" },
  { id: "a_3", taskId: "DS-82", uploadedBy: "u_elena", fileName: "implementation-notes.md", mimeType: "text/markdown", fileSize: 14_800, createdAt: "2026-11-20T13:40:00.000Z" },
];

export const demoActivity: DemoActivity[] = [
  { id: "act_1", actorId: "u_marcus", entityType: "task", action: "commented", message: "left a note on Build theme variable generator", createdAt: "2026-11-21T08:42:00.000Z" },
  { id: "act_2", actorId: "u_sarah", entityType: "task", action: "moved", message: "moved Refine focus treatment to To do", createdAt: "2026-11-21T07:20:00.000Z" },
  { id: "act_3", actorId: "u_david", entityType: "project", action: "updated", message: "updated the Core Engine v3 Migration project", createdAt: "2026-11-20T16:55:00.000Z" },
  { id: "act_4", actorId: "u_amina", entityType: "task", action: "completed", message: "completed Set up component contribution guide", createdAt: "2026-11-20T14:32:00.000Z" },
  { id: "act_5", actorId: "u_jules", entityType: "member", action: "joined", message: "joined the workspace", createdAt: "2026-11-20T10:10:00.000Z" },
];

export const demoNotifications: DemoNotification[] = [
  { id: "n_1", type: "task_comment", title: "New comment on your task", message: "Marcus mentioned you on Build theme variable generator.", readAt: null, createdAt: "2026-11-21T08:42:00.000Z" },
  { id: "n_2", type: "task_due", title: "Task due soon", message: "Review partition strategy for event streams is due in 3 days.", readAt: null, createdAt: "2026-11-21T07:00:00.000Z" },
  { id: "n_3", type: "project_update", title: "Project update", message: "Core Engine v3 Migration has a new delivery note.", readAt: "2026-11-20T18:00:00.000Z", createdAt: "2026-11-20T16:55:00.000Z" },
];

export function getStatus(statusId: string) {
  return demoStatuses.find((status) => status.id === statusId);
}

export function getProject(projectId: string) {
  return demoProjects.find((project) => project.id === projectId) ?? demoProjects[0];
}

export function getMember(memberId: string | null | undefined) {
  return demoMembers.find((member) => member.id === memberId);
}

export function getProjectTasks(projectId: string) {
  return demoTasks.filter((task) => task.projectId === projectId);
}

export function getTask(taskId: string) {
  return demoTasks.find((task) => task.id.toLowerCase() === taskId.toLowerCase() || task.key.toLowerCase() === taskId.toLowerCase());
}

export function getProjectProgress(projectId: string) {
  const tasks = getProjectTasks(projectId);
  if (!tasks.length) return 0;
  const complete = tasks.filter((task) => getStatus(task.statusId)?.isCompleted).length;
  return Math.round((complete / tasks.length) * 100);
}

export function formatShortDate(date: string | null | undefined) {
  if (!date) return "No due date";
  const value = new Date(`${date.slice(0, 10)}T12:00:00`);
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatFileSize(size: number) {
  if (size < 1_000_000) return `${Math.max(1, Math.round(size / 1_000))} KB`;
  return `${(size / 1_000_000).toFixed(1)} MB`;
}
