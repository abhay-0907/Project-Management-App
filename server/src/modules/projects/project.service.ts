import type { Project } from "../../db/schema/projects.schema.js";
import * as projectRepository from "./project.repository.js";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "./project.validation.js";
import type { ActivityActor } from "../activity-logs/activity.types.js";

export class ProjectError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ProjectError";
  }
}

export async function createProjectService(
  workspaceId: string,
  actor: ActivityActor,
  input: CreateProjectInput,
) {
  try {
    const project = await projectRepository.createProject({
      workspaceId,
      createdBy: actor.id,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "ACTIVE",
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
    }, actor);
    if (!project) throw new Error("Project creation returned no record");
    return project;
  } catch (error) {
    if (isConstraintViolation(error, "23514")) {
      throw new ProjectError(400, "Due date cannot be earlier than the start date");
    }
    throw error;
  }
}

export function listProjectsService(workspaceId: string, query: ListProjectsQuery) {
  return projectRepository.listWorkspaceProjects(workspaceId, query);
}

export async function getProjectDetailsService(workspaceId: string, projectId: string) {
  const project = await projectRepository.findProjectWithCreator(workspaceId, projectId);
  if (!project) throw new ProjectError(404, "Project not found");
  return project;
}

export async function updateProjectService(
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput,
  actor: ActivityActor,
) {
  const current: Project | null = await projectRepository.findProjectInWorkspace(
    workspaceId,
    projectId,
  );
  if (!current) throw new ProjectError(404, "Project not found");

  const startDate = input.startDate === undefined ? current.startDate : input.startDate;
  const dueDate = input.dueDate === undefined ? current.dueDate : input.dueDate;
  if (startDate && dueDate && dueDate < startDate) {
    throw new ProjectError(400, "Due date cannot be earlier than the start date");
  }

  try {
    const project = await projectRepository.updateProject(workspaceId, projectId, input, actor);
    if (!project) throw new ProjectError(404, "Project not found");
    return project;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    if (isConstraintViolation(error, "23514")) {
      throw new ProjectError(400, "Due date cannot be earlier than the start date");
    }
    throw error;
  }
}

export async function deleteProjectService(workspaceId: string, projectId: string, actor: ActivityActor) {
  const deleted = await projectRepository.deleteProjectPermanently(workspaceId, projectId, actor);
  if (!deleted) throw new ProjectError(404, "Project not found");
}

export function isProjectError(error: unknown): error is ProjectError {
  return error instanceof ProjectError;
}

function isConstraintViolation(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
