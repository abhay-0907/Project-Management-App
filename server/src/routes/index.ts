import { Router } from "express";
import authRouter from "../modules/auth/auth.route.js";
import workspaceRouter from "../modules/workspaces/workspace.routes.js";
import invitationRouter from "../modules/invitations/invitation.routes.js";

const router = Router();
router.use("/auth", authRouter);
router.use("/invitations", invitationRouter);
router.use("/workspaces", workspaceRouter);

export default router;
