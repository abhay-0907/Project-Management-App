import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const memberIdSchema = z.string().uuid();

export const updateMemberRoleSchema = z.strictObject({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export function validateMemberId(req: Request, res: Response, next: NextFunction) {
  const parsed = memberIdSchema.safeParse(req.params.memberId);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid workspace member id" });
    return;
  }
  req.memberId = parsed.data;
  next();
}

export function validateUpdateMemberRole(req: Request, res: Response, next: NextFunction) {
  const parsed = updateMemberRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid workspace member role",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  req.updateMemberRoleInput = parsed.data;
  next();
}
