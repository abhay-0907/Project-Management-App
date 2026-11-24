import type { WorkspaceMember } from "../../db/schema/workspace-members.schema.js";
import type { Project } from "../../db/schema/projects.schema.js";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "../projects/project.validation.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "../tasks/task.validation.js";
import type {
  CreateBoardColumnInput,
  DeleteBoardColumnInput,
  UpdateBoardColumnInput,
} from "../tasks/board.validation.js";
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
      createProjectInput?: CreateProjectInput;
      updateProjectInput?: UpdateProjectInput;
      projectListQuery?: ListProjectsQuery;
      projectId?: string;
      project?: Project;
      createTaskInput?: CreateTaskInput;
      updateTaskInput?: UpdateTaskInput;
      taskListQuery?: ListTasksQuery;
      taskId?: string;
      statusId?: string;
      createBoardColumnInput?: CreateBoardColumnInput;
      updateBoardColumnInput?: UpdateBoardColumnInput;
      deleteBoardColumnInput?: DeleteBoardColumnInput;
    }
  }
}
