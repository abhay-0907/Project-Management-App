"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "../api/invitation.api";
import { activityQueryKeys } from "@/features/activity-logs/hooks/use-activity-feed";

export const invitationQueryKeys = {
  all: ["invitations"] as const,
  workspace: (workspaceId: string) => ["workspaces", workspaceId, "invitations"] as const,
  preview: (token: string) => ["invitations", "preview", token] as const,
};

export function useWorkspaceInvitations(workspaceId?: string) {
  return useQuery({
    queryKey: workspaceId ? invitationQueryKeys.workspace(workspaceId) : [...invitationQueryKeys.all, "disabled"],
    queryFn: () => invitationApi.list(workspaceId!),
    enabled: Boolean(workspaceId),
    retry: false,
  });
}

export function useInvitationPreview(token: string) {
  return useQuery({ queryKey: invitationQueryKeys.preview(token), queryFn: () => invitationApi.preview(token), enabled: Boolean(token), retry: false });
}

export function useCreateInvitation(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: { email: string; role: "ADMIN" | "MEMBER" }) => invitationApi.create(workspaceId, input),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: invitationQueryKeys.workspace(workspaceId) }),
      client.invalidateQueries({ queryKey: activityQueryKeys.workspace(workspaceId) }),
    ]) });
}

export function useCancelInvitation(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => invitationApi.cancel(workspaceId, id),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: invitationQueryKeys.workspace(workspaceId) }),
      client.invalidateQueries({ queryKey: activityQueryKeys.workspace(workspaceId) }),
    ]) });
}

export function useResendInvitation(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => invitationApi.resend(workspaceId, id),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: invitationQueryKeys.workspace(workspaceId) }),
      client.invalidateQueries({ queryKey: activityQueryKeys.workspace(workspaceId) }),
    ]) });
}

export function useAcceptInvitation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: invitationApi.accept, onSuccess: () => client.invalidateQueries({ queryKey: ["workspaces"] }) });
}

export function useRejectInvitation() {
  return useMutation({ mutationFn: invitationApi.reject });
}
