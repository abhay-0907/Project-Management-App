import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const invitationIdSchema = z.string().uuid();
const tokenSchema = z.string().min(40).max(50).regex(/^[A-Za-z0-9_-]+$/);
export const createInvitationSchema = z.strictObject({
  email: z.string().trim().email().max(255).transform((email) => email.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});
const tokenBodySchema = z.strictObject({ token: tokenSchema });

export function validateCreateInvitation(req: Request, res: Response, next: NextFunction) {
  const parsed = createInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invitation", details: parsed.error.flatten().fieldErrors });
    return;
  }
  req.invitationInput = parsed.data;
  next();
}

export function validateInvitationId(req: Request, res: Response, next: NextFunction) {
  const parsed = invitationIdSchema.safeParse(req.params.invitationId);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invitation id" });
    return;
  }
  req.invitationId = parsed.data;
  next();
}

export function validateInvitationToken(req: Request, res: Response, next: NextFunction) {
  const parsed = tokenSchema.safeParse(req.params.token);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invitation token" });
    return;
  }
  req.invitationToken = parsed.data;
  next();
}

export function validateInvitationTokenBody(req: Request, res: Response, next: NextFunction) {
  const parsed = tokenBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invitation token", details: parsed.error.flatten().fieldErrors });
    return;
  }
  req.invitationAcceptInput = parsed.data;
  req.invitationRejectInput = parsed.data;
  next();
}
