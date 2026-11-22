import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Workspace name is required").max(150);
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Workspace slug is required")
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens");

export const createWorkspaceSchema = z.strictObject({
  name: nameSchema,
  slug: slugSchema,
});

export const updateWorkspaceSchema = z
  .strictObject({
    name: nameSchema.optional(),
    slug: slugSchema.optional(),
  })
  .refine((input) => input.name !== undefined || input.slug !== undefined, {
    message: "At least one workspace field must be provided",
  });

export const workspaceIdSchema = z.string().uuid();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
