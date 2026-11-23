export class TaskError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "TaskError";
  }
}

export function isTaskError(error: unknown): error is TaskError {
  return error instanceof TaskError;
}
