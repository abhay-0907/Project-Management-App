import { z } from "zod";
import { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } from "./activity.constants.js";

export const activityQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(ACTIVITY_ACTIONS).optional(),
  actorId: z.string().uuid().optional(),
  entityType: z.enum(ACTIVITY_ENTITY_TYPES).optional(),
  from: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid start date").optional(),
  to: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid end date").optional(),
}).refine((query) => !query.from || !query.to || Date.parse(query.from) <= Date.parse(query.to), {
  message: "The start date must not be after the end date",
  path: ["from"],
});

export type ParsedActivityQuery = z.infer<typeof activityQuerySchema>;
