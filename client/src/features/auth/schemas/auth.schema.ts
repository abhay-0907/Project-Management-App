import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.").max(255).transform((value) => value.toLowerCase());
const password = z.string().min(8, "Use at least 8 characters.").max(128, "Password must be 128 characters or fewer.");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const verifyEmailSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});

export const forgotPasswordSchema = z.object({ email });

export const verifyPasswordResetOtpSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(32, "Verify your email code first."),
    password,
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
