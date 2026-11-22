import { Router } from "express";
import {
    changePasswordController,
    forgotPasswordController,
    loginController,
    logoutController,
    logoutAllController,
    meController,
    resendVerificationController,
    registerController,
    resetPasswordController,
    revokeSessionController,
    sessionsController,
    verifyPasswordResetOtpController,
    verifyEmailController,
} from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/verify-email", verifyEmailController);
authRouter.post("/resend-verification", resendVerificationController);
authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/verify-password-reset-otp", verifyPasswordResetOtpController);
authRouter.post("/reset-password", resetPasswordController);
authRouter.post("/login", loginController);
authRouter.get("/me", requireAuth, meController);
authRouter.post("/logout", logoutController);
authRouter.post("/change-password", requireAuth, changePasswordController);
authRouter.get("/sessions", requireAuth, sessionsController);
authRouter.delete("/sessions/:sessionId", requireAuth, revokeSessionController);
authRouter.post("/logout-all", requireAuth, logoutAllController);

export default authRouter;
