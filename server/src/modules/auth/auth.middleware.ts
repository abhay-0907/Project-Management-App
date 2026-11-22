import type { NextFunction, Request, Response } from "express";
import { authenticate } from "./auth.service.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = readCookie(req, "nexora_session");
    const auth = token ? await authenticate(token) : null;
    if (!auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.auth = auth;
    next();
  } catch (error) {
    next(error);
  }
}

export function readCookie(req: Request, name: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0 || pair.slice(0, separator).trim() !== name) continue;
    return pair.slice(separator + 1).trim();
  }
  return undefined;
}
