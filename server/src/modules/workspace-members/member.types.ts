import type { WorkspaceRole } from "../workspaces/workspace.types.js";

export type EditableWorkspaceMemberRole = "ADMIN" | "MEMBER";
export type MemberRole = WorkspaceRole;
export type UpdateMemberRoleInput = { role: EditableWorkspaceMemberRole };

declare global {
  namespace Express {
    interface Request {
      memberId?: string;
      updateMemberRoleInput?: UpdateMemberRoleInput;
    }
  }
}
