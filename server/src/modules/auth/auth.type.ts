import type { User } from "../../db/schema/users.schema.js";

export type PublicUser = Pick<User, "id" | "name" | "email" | "emailVerifiedAt" | "createdAt">;

declare global {
  namespace Express {
    interface Request {
      auth?: { user: PublicUser; sessionId: string };
    }
  }
}

export function toPublicUser(user: User): PublicUser {
  const { id, name, email, emailVerifiedAt, createdAt } = user;
  return { id, name, email, emailVerifiedAt, createdAt };
}
