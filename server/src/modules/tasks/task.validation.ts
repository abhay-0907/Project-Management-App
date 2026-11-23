import { z } from "zod";
import { taskPriorityValues } from "../../db/schema/tasks.schema.js";

const taskTitleSchema = z.string().trim().min(1, "Task title is required").max(255);
const taskDescriptionSchema = z.string().trim().max(20_000).nullable();
const taskPrioritySchema = z.enum(taskPriorityValues);
const taskIdSchema = z.string().uuid();

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

const taskDateSchema = z.string().refine(isCalendarDate, "Use a valid date in YYYY-MM-DD format");
const optionalTaskDateSchema = taskDateSchema.nullable().optional();

function hasValidDateOrder(input: { startDate?: string | null; dueDate?: string | null }) {
  return !input.startDate || !input.dueDate || input.dueDate >= input.startDate;
}

export const createTaskSchema = z
  .strictObject({
    title: taskTitleSchema,
    description: taskDescriptionSchema.optional(),
    priority: taskPrioritySchema.optional(),
    statusId: taskIdSchema.optional(),
    assigneeId: taskIdSchema.nullable().optional(),
    parentTaskId: taskIdSchema.nullable().optional(),
    startDate: optionalTaskDateSchema,
    dueDate: optionalTaskDateSchema,
  })
  .refine(hasValidDateOrder, {
    message: "Due date cannot be earlier than the start date",
    path: ["dueDate"],
  });

export const updateTaskSchema = z
  .strictObject({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.optional(),
    priority: taskPrioritySchema.optional(),
    assigneeId: taskIdSchema.nullable().optional(),
    statusId: taskIdSchema.optional(),
    startDate: optionalTaskDateSchema,
    dueDate: optionalTaskDateSchema,
  })
  .refine(
    (input) =>
      input.title !== undefined ||
      input.description !== undefined ||
      input.priority !== undefined ||
      input.assigneeId !== undefined ||
      input.statusId !== undefined ||
      input.startDate !== undefined ||
      input.dueDate !== undefined,
    { message: "At least one task field must be provided" },
  )
  .refine(hasValidDateOrder, {
    message: "Due date cannot be earlier than the start date",
    path: ["dueDate"],
  });

export const listTasksQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  statusId: taskIdSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: taskIdSchema.optional(),
  sort: z.enum(["position", "createdAt", "updatedAt", "dueDate"]).default("position"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const taskIdParamSchema = taskIdSchema;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
