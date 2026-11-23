"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectApi, type ProjectInput, type ProjectListQuery } from "../api/project.api";

export const projectQueryKeys = {
  all: (workspaceId: string) => ["workspaces", workspaceId, "projects"] as const,
  list: (workspaceId: string, query: ProjectListQuery) =>
    ["workspaces", workspaceId, "projects", "list", query] as const,
  detail: (workspaceId: string, projectId: string) =>
    ["workspaces", workspaceId, "projects", projectId] as const,
};

export function useProjects(workspaceId: string | undefined, query: ProjectListQuery) {
  return useQuery({
    queryKey: projectQueryKeys.list(workspaceId ?? "none", query),
    queryFn: () => projectApi.list(workspaceId!, query),
    enabled: Boolean(workspaceId),
    retry: false,
    staleTime: 30_000,
  });
}

export function useProject(workspaceId: string | undefined, projectId: string) {
  return useQuery({
    queryKey: projectQueryKeys.detail(workspaceId ?? "none", projectId),
    queryFn: () => projectApi.get(workspaceId!, projectId),
    enabled: Boolean(workspaceId && projectId),
    retry: false,
    staleTime: 30_000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, input }: { workspaceId: string; input: ProjectInput }) =>
      projectApi.create(workspaceId, input),
    onSuccess: (_result, variables) =>
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all(variables.workspaceId) }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      input,
    }: {
      workspaceId: string;
      projectId: string;
      input: Partial<ProjectInput>;
    }) => projectApi.update(workspaceId, projectId, input),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all(variables.workspaceId) });
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.detail(variables.workspaceId, variables.projectId),
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, projectId }: { workspaceId: string; projectId: string }) =>
      projectApi.delete(workspaceId, projectId),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all(variables.workspaceId) });
      queryClient.removeQueries({
        queryKey: projectQueryKeys.detail(variables.workspaceId, variables.projectId),
        exact: true,
      });
    },
  });
}
