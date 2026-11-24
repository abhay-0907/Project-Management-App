import type { Invitation } from "../../db/schema/invitations.schema.js";

export type CreateInvitationInput = { email: string; role: "ADMIN" | "MEMBER" };
export type InvitationRequest = {
  invitationInput?: CreateInvitationInput;
  invitationId?: string;
  invitationToken?: string;
  invitationAcceptInput?: { token: string };
  invitationRejectInput?: { token: string };
};
export type InvitationRecord = Invitation & { invitedByName: string };

declare global {
  namespace Express {
    interface Request extends InvitationRequest {}
  }
}

export type { Invitation };
