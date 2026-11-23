"use client";

import { useQuery } from "@tanstack/react-query";
import { projectApi } from "@/features/projects/api/project.api";
import type { ProjectRecord } from "@/features/projects/api/project.api";
import { taskApi } from "../api/task.api";
import type { TaskRecord, TaskStatus } from "../types/task.types";

export const workspaceTaskOverviewKey = (workspaceId: string) =>
  ["workspaces", workspaceId, "tasks", "overview"] as const;

export interface WorkspaceTaskOverview {
  projects: ProjectRecord[];
  tasks: Array<{ task: TaskRecord; project: ProjectRecord }>;
  statuses: Array<TaskStatus & { projectId: string }>;
}

async function listWorkspaceProjects(workspaceId: string) {
  const firstPage = await projectApi.list(workspaceId, {
    page: 1,
    pageSize: 100,
    sort: "updated",
  });
  const projects = [...firstPage.projects];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const result = await projectApi.list(workspaceId, { page, pageSize: 100, sort: "updated" });
    projects.push(...result.projects);
  }
  return projects;
}

async function listProjectTasks(workspaceId: string, project: ProjectRecord) {
  const firstPage = await taskApi.list(workspaceId, project.id, {
    page: 1,
    pageSize: 100,
    sort: "position",
    order: "asc",
  });
  const tasks = [...firstPage.tasks];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const result = await taskApi.list(workspaceId, project.id, {
      page,
      pageSize: 100,
      sort: "position",
      order: "asc",
    });
    tasks.push(...result.tasks);
  }
  return { tasks, statuses: firstPage.statuses.map((status) => ({ ...status, projectId: project.id })) };
}

async function fetchWorkspaceTaskOverview(workspaceId: string): Promise<WorkspaceTaskOverview> {
  const projects = await listWorkspaceProjects(workspaceId);
  const projectResults: Awaited<ReturnType<typeof listProjectTasks>>[] = [];
  for (let offset = 0; offset < projects.length; offset += 8) {
    const batch = projects.slice(offset, offset + 8);
    projectResults.push(...await Promise.all(batch.map((project) => listProjectTasks(workspaceId, project))));
  }
  return {
    projects,
    tasks: projectResults.flatMap((result, index) =>
      result.tasks.map((task) => ({ task, project: projects[index]! })),
    ),
    statuses: projectResults.flatMap((result) => result.statuses),
  };
}

export function useWorkspaceTaskOverview(workspaceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: workspaceTaskOverviewKey(workspaceId ?? "none"),
    queryFn: () => fetchWorkspaceTaskOverview(workspaceId!),
    enabled: Boolean(workspaceId) && enabled,
    retry: false,
    staleTime: 30_000,
  });
}
