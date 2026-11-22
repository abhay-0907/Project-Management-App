import { z } from "zod";

const email = z.string().trim().email().max(255).transform((value) => value.toLowerCase());
const password = z.string().min(8).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password,
});

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const verifyEmailSchema = z.object({ email, otp: z.string().regex(/^\d{6}$/) });
export const resendVerificationSchema = z.object({ email });
export const forgotPasswordSchema = z.object({ email });
export const verifyPasswordResetOtpSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/),
});
export const resetPasswordSchema = z.object({
  resetToken: z.string().min(32).max(200),
  password,
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});
export const sessionIdSchema = z.string().uuid();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type VerifyPasswordResetOtpInput = z.infer<typeof verifyPasswordResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
