import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .max(255, "Email address must be 255 characters or fewer.")
    .email("Enter a valid email address.")
    .transform((email) => email.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
