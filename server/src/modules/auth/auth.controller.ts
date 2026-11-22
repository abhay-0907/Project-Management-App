import type { Request, Response } from "express";
import {
  AuthError,
  changePassword,
  clearSessionCookie,
  forgotPassword,
  getSessions,
  login,
  logoutAll,
  logout,
  resetPassword,
  resendVerificationCode,
  register,
  revokeSession,
  sessionCookie,
  verifyPasswordResetOtp,
  verifyEmail,
} from "./auth.service.js";
import { readCookie } from "./auth.middleware.js";
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
  registerSchema,
  resetPasswordSchema,
  sessionIdSchema,
  verifyPasswordResetOtpSchema,
  verifyEmailSchema,
} from "./auth.validation.js";

export async function registerController(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({
        error: "Invalid registration input",
        details: parsed.error.flatten().fieldErrors,
      });
  try {
    return res.status(201).json(await register(parsed.data));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyEmailController(req: Request, res: Response) {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "A valid email address and 6-digit verification code are required" });
  try {
    return res.status(200).json(await verifyEmail(parsed.data));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendVerificationController(req: Request, res: Response) {
  const parsed = resendVerificationSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "A valid email address is required" });
  try {
    return res.status(200).json(await resendVerificationCode(parsed.data.email));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function forgotPasswordController(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "A valid email address is required" });
  try {
    return res.status(200).json(await forgotPassword(parsed.data.email));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "A valid reset ticket and password are required" });
  try {
    const result = await resetPassword(parsed.data);
    return res.status(200).json({ message: result.message });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyPasswordResetOtpController(req: Request, res: Response) {
  const parsed = verifyPasswordResetOtpSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "A valid email address and 6-digit code are required" });
  try {
    return res.status(200).json(await verifyPasswordResetOtp(parsed.data));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function changePasswordController(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({
      error: "Invalid password change input",
      details: parsed.error.flatten().fieldErrors,
    });
  try {
    return res.status(200).json(
      await changePassword(req.auth!.user.id, req.auth!.sessionId, parsed.data),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function sessionsController(req: Request, res: Response) {
  try {
    return res.status(200).json({
      sessions: await getSessions(req.auth!.user.id, req.auth!.sessionId),
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function revokeSessionController(req: Request, res: Response) {
  const parsed = sessionIdSchema.safeParse(req.params.sessionId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid session id" });
  try {
    const result = await revokeSession(req.auth!.user.id, parsed.data);
    if (parsed.data === req.auth!.sessionId) res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function logoutAllController(req: Request, res: Response) {
  try {
    const result = await logoutAll(req.auth!.user.id);
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function loginController(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({
        error: "Invalid login input",
        details: parsed.error.flatten().fieldErrors,
      });
  try {
    const result = await login(parsed.data, {
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });
    res.setHeader("Set-Cookie", sessionCookie(result.token, result.expiresAt));
    return res
      .status(200)
      .json({ user: result.user, expiresAt: result.expiresAt });
  } catch (error) {
    return handleError(res, error);
  }
}

export function meController(req: Request, res: Response) {
  return res.status(200).json({ user: req.auth!.user });
}

export async function logoutController(req: Request, res: Response) {
  try {
    await logout(readCookie(req, "nexora_session"));
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ message: "Signed out" });
  } catch (error) {
    return handleError(res, error);
  }
}

function handleError(res: Response, error: unknown) {
  if (error instanceof AuthError)
    return res.status(error.status).json({ error: error.message });
  console.error("Authentication request failed", error);
  return res.status(500).json({ error: "Authentication request failed" });
}
