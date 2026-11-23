import * as boardRepository from "./board.repository.js";
import { BoardError } from "./board.errors.js";
import type {
  CreateBoardColumnInput,
  DeleteBoardColumnInput,
  UpdateBoardColumnInput,
} from "./board.validation.js";

export async function getProjectBoardService(workspaceId: string, projectId: string) {
  const board = await boardRepository.getProjectBoard(workspaceId, projectId);
  if (!board) throw new BoardError(404, "Project not found");
  return board;
}

export async function createBoardColumnService(
  workspaceId: string,
  projectId: string,
  input: CreateBoardColumnInput,
) {
  try {
    const column = await boardRepository.createBoardColumn(
      workspaceId,
      projectId,
      boardRepository.makeStatusSlug(input.name),
      input,
    );
    if (!column) throw new BoardError(404, "Project not found");
    return column;
  } catch (error) {
    throw mapBoardPersistenceError(error);
  }
}

export async function updateBoardColumnService(
  workspaceId: string,
  projectId: string,
  statusId: string,
  input: UpdateBoardColumnInput,
) {
  try {
    const column = await boardRepository.updateBoardColumn(
      workspaceId,
      projectId,
      statusId,
      input.name === undefined ? undefined : boardRepository.makeStatusSlug(input.name),
      input,
    );
    if (!column) throw new BoardError(404, "Board column not found");
    return column;
  } catch (error) {
    throw mapBoardPersistenceError(error);
  }
}

export async function deleteBoardColumnService(
  workspaceId: string,
  projectId: string,
  statusId: string,
  input: DeleteBoardColumnInput,
) {
  try {
    const result = await boardRepository.deleteBoardColumn(
      workspaceId,
      projectId,
      statusId,
      input,
    );
    if (!result) throw new BoardError(404, "Board column not found");
    return result;
  } catch (error) {
    throw mapBoardPersistenceError(error);
  }
}

function mapBoardPersistenceError(error: unknown): Error {
  if (error instanceof BoardError) return error;
  if (hasPostgresCode(error, "23505")) {
    return new BoardError(409, "A board column with this name already exists");
  }
  if (hasPostgresCode(error, "23503")) {
    return new BoardError(400, "The selected column is not valid for this project");
  }
  return error instanceof Error ? error : new Error("Board operation failed");
}

function hasPostgresCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
