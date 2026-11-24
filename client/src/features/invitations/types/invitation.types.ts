export type InvitationRole = "ADMIN" | "MEMBER";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "REVOKED";

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedByName: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface InvitationPreview {
  workspaceName: string;
  workspaceSlug: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  inviterName: string;
  expiresAt: string;
}
