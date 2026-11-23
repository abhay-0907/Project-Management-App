import { z } from "zod";

export const projectLifecycleStatuses = [
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
] as const;

const projectNameSchema = z.string().trim().min(1, "Project name is required").max(150);
const projectDescriptionSchema = z.string().trim().max(10_000).nullable();
const projectStatusSchema = z.enum(projectLifecycleStatuses);

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

const projectDateSchema = z
  .string()
  .refine(isCalendarDate, "Use a valid date in YYYY-MM-DD format");
const optionalProjectDateSchema = projectDateSchema.nullable().optional();

function hasValidDateOrder(input: { startDate?: string | null; dueDate?: string | null }) {
  return !input.startDate || !input.dueDate || input.dueDate >= input.startDate;
}

export const createProjectSchema = z
  .strictObject({
    name: projectNameSchema,
    description: projectDescriptionSchema.optional(),
    status: projectStatusSchema.optional(),
    startDate: optionalProjectDateSchema,
    dueDate: optionalProjectDateSchema,
  })
  .refine(hasValidDateOrder, {
    message: "Due date cannot be earlier than the start date",
    path: ["dueDate"],
  });

export const updateProjectSchema = z
  .strictObject({
    name: projectNameSchema.optional(),
    description: projectDescriptionSchema.optional(),
    status: projectStatusSchema.optional(),
    startDate: optionalProjectDateSchema,
    dueDate: optionalProjectDateSchema,
  })
  .refine(
    (input) =>
      input.name !== undefined ||
      input.description !== undefined ||
      input.status !== undefined ||
      input.startDate !== undefined ||
      input.dueDate !== undefined,
    { message: "At least one project field must be provided" },
  )
  .refine(hasValidDateOrder, {
    message: "Due date cannot be earlier than the start date",
    path: ["dueDate"],
  });

export const listProjectsQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(150).optional(),
  status: projectStatusSchema.optional(),
  sort: z.enum(["updated", "newest", "name"]).default("updated"),
});

export const projectIdSchema = z.string().uuid();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
