import { z } from "zod";

const statusIdSchema = z.string().uuid();
const columnNameSchema = z.string().trim().min(1).max(100);
const colorSchema = z.string().regex(/^#[\da-f]{6}$/i, "Use a six-digit hex color");

export const createBoardColumnSchema = z.strictObject({
  name: columnNameSchema,
  color: colorSchema.optional(),
  isDefault: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
});

export const updateBoardColumnSchema = z
  .strictObject({
    name: columnNameSchema.optional(),
    color: colorSchema.nullable().optional(),
    position: z.number().int().min(0).max(1000).optional(),
    isDefault: z.boolean().optional(),
    isCompleted: z.boolean().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one column field must be provided",
  });

export const deleteBoardColumnSchema = z.strictObject({
  reassignToStatusId: statusIdSchema.optional(),
});

export const boardStatusIdParamSchema = statusIdSchema;

export type CreateBoardColumnInput = z.infer<typeof createBoardColumnSchema>;
export type UpdateBoardColumnInput = z.infer<typeof updateBoardColumnSchema>;
export type DeleteBoardColumnInput = z.infer<typeof deleteBoardColumnSchema>;
