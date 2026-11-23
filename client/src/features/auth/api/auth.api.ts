import type {
  AuthSession,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  LoginResponse,
  MessageResponse,
  RegisterInput,
  RegisterResponse,
  ResetPasswordInput,
  User,
  VerifyEmailInput,
  VerifyPasswordResetOtpInput,
} from "../types/auth.types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const body = payload as {
      error?: string;
      details?: Record<string, string[] | undefined>;
    } | null;
    throw new AuthApiError(
      body?.error ?? "The authentication request failed. Please try again.",
      response.status,
      body?.details,
    );
  }

  return payload as T;
}

export const authApi = {
  register(input: RegisterInput) {
    return request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  login(input: LoginInput) {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  logout() {
    return request<MessageResponse>("/auth/logout", { method: "POST" });
  },

  getCurrentUser() {
    return request<{ user: User }>("/auth/me").then(({ user }) => user);
  },

  verifyEmail(input: VerifyEmailInput) {
    return request<{ user: User; message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  resendVerification(input: { email: string }) {
    return request<MessageResponse>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  forgotPassword(input: ForgotPasswordInput) {
    return request<MessageResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  verifyPasswordResetOtp(input: VerifyPasswordResetOtpInput) {
    return request<{ resetToken: string; message: string }>("/auth/verify-password-reset-otp", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  resetPassword(input: ResetPasswordInput) {
    return request<MessageResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ resetToken: input.resetToken, password: input.password }),
    });
  },

  changePassword(input: ChangePasswordInput) {
    return request<MessageResponse>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getSessions() {
    return request<{ sessions: AuthSession[] }>("/auth/sessions").then(
      ({ sessions }) => sessions,
    );
  },

  revokeSession(sessionId: string) {
    return request<MessageResponse>(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
  },

  logoutAll() {
    return request<MessageResponse>("/auth/logout-all", { method: "POST" });
  },
};

export const {
  register,
  login,
  logout,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  changePassword,
  getSessions,
  revokeSession,
  logoutAll,
} = authApi;
