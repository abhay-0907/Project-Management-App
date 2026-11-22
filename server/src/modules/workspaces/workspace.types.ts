import type { WorkspaceMember } from "../../db/schema/workspace-members.schema.js";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspace.validation.js";

export type WorkspaceRole = WorkspaceMember["role"];
export type WorkspaceMembership = Pick<
  WorkspaceMember,
  "id" | "workspaceId" | "userId" | "role" | "joinedAt"
>;

declare global {
  namespace Express {
    interface Request {
      workspaceMembership?: WorkspaceMembership;
      createWorkspaceInput?: CreateWorkspaceInput;
      updateWorkspaceInput?: UpdateWorkspaceInput;
    }
  }
}
