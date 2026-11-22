import { AuthApiError } from "../api/auth.api";

export const authQueryKeys = {
  currentUser: ["auth", "current-user"] as const,
  sessions: ["auth", "sessions"] as const,
};

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function getFirstFieldErrors(error: { fieldErrors: object }) {
  return Object.fromEntries(
    Object.entries(error.fieldErrors)
      .filter(([, messages]) => Array.isArray(messages) && messages[0])
      .map(([field, messages]) => [field, (messages as string[])[0]]),
  ) as Record<string, string>;
}

export function getSessionDeviceName(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  if (/iPhone|iPad/i.test(userAgent)) return "Apple mobile device";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/Windows/i.test(userAgent)) return "Windows device";
  if (/Mac OS|Macintosh/i.test(userAgent)) return "Mac device";
  if (/Linux/i.test(userAgent)) return "Linux device";
  return "Browser session";
}
