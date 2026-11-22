import type { z } from "zod";
import type {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyPasswordResetOtpSchema,
  verifyEmailSchema,
} from "../schemas/auth.schema";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyPasswordResetOtpInput = z.infer<typeof verifyPasswordResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterResponse extends MessageResponse {
  user: User;
}

export interface LoginResponse {
  user: User;
  expiresAt: string;
}
