import type { InvitationPreview, InvitationRole, WorkspaceInvitation } from "../types/invitation.types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export class InvitationApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "InvitationApiError";
  }
}

export type CreatedInvitation = Pick<WorkspaceInvitation, "id" | "email" | "role" | "status" | "expiresAt" | "createdAt">;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, credentials: "include", headers });
  } catch {
    throw new InvitationApiError("Could not reach the server. Check your connection and try again.", 0);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new InvitationApiError(
      (payload as { error?: string } | null)?.error ?? "The invitation request failed. Please try again.",
      response.status,
    );
  }
  return payload as T;
}

export const invitationApi = {
  list(workspaceId: string) {
    return request<{ invitations: WorkspaceInvitation[] }>(`/workspaces/${encodeURIComponent(workspaceId)}/invitations`)
      .then(({ invitations }) => invitations);
  },
  create(workspaceId: string, input: { email: string; role: InvitationRole }) {
    return request<{ invitation: CreatedInvitation; message: string }>(`/workspaces/${encodeURIComponent(workspaceId)}/invitations`, {
      method: "POST", body: JSON.stringify(input),
    });
  },
  cancel(workspaceId: string, invitationId: string) {
    return request<{ message: string }>(`/workspaces/${encodeURIComponent(workspaceId)}/invitations/${encodeURIComponent(invitationId)}`, { method: "DELETE" });
  },
  resend(workspaceId: string, invitationId: string) {
    return request<{ message: string; expiresAt: string }>(`/workspaces/${encodeURIComponent(workspaceId)}/invitations/${encodeURIComponent(invitationId)}/resend`, { method: "POST" });
  },
  preview(token: string) {
    return request<{ invitation: InvitationPreview }>(`/invitations/${encodeURIComponent(token)}`).then(({ invitation }) => invitation);
  },
  accept(token: string) {
    return request<{ workspaceId: string; workspaceSlug: string; message: string }>("/invitations/accept", {
      method: "POST", body: JSON.stringify({ token }),
    });
  },
  reject(token: string) {
    return request<{ message: string }>("/invitations/reject", {
      method: "POST", body: JSON.stringify({ token }),
    });
  },
};
