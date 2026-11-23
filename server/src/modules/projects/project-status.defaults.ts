export const DEFAULT_PROJECT_STATUSES = [
  {
    name: "To Do",
    slug: "todo",
    position: 0,
    color: "#94a3b8",
    isDefault: true,
    isCompleted: false,
  },
  {
    name: "In Progress",
    slug: "in-progress",
    position: 1,
    color: "#3b82f6",
    isDefault: false,
    isCompleted: false,
  },
  {
    name: "Done",
    slug: "done",
    position: 2,
    color: "#22c55e",
    isDefault: false,
    isCompleted: true,
  },
] as const;
