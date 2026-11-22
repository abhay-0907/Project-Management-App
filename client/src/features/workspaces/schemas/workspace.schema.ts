import { z } from "zod";

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a workspace name")
  .max(150, "Workspace names can be up to 150 characters");

export const workspaceSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a workspace URL")
  .max(100, "Workspace URLs can be up to 100 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens");

export const createWorkspaceSchema = z.strictObject({
  name: workspaceNameSchema,
  slug: workspaceSlugSchema,
});

export const updateWorkspaceSchema = z
  .strictObject({
    name: workspaceNameSchema.optional(),
    slug: workspaceSlugSchema.optional(),
  })
  .refine((input) => input.name !== undefined || input.slug !== undefined, {
    message: "Change at least one workspace field",
  });

export function slugifyWorkspaceName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
}

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
