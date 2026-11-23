export class BoardError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BoardError";
  }
}

export function isBoardError(error: unknown): error is BoardError {
  return error instanceof BoardError;
}
