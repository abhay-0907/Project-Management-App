"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/shared/icon";
import { createInvitationSchema, type CreateInvitationInput } from "../schemas/invitation.schema";

type InviteMemberDialogProps = {
  allowAdmin: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: CreateInvitationInput) => Promise<string | undefined>;
};

export function InviteMemberDialog({ allowAdmin, pending, onClose, onSubmit }: InviteMemberDialogProps) {
  const headingId = useId();
  const emailErrorId = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreateInvitationInput["role"]>("MEMBER");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    setFormError("");

    const parsed = createInvitationSchema.safeParse({ email, role });
    if (!parsed.success) {
      setEmailError(parsed.error.issues.find((issue) => issue.path[0] === "email")?.message ?? "Enter a valid email address.");
      return;
    }
    if (!allowAdmin && parsed.data.role === "ADMIN") {
      setFormError("Only a workspace owner can invite an admin.");
      return;
    }

    const error = await onSubmit(parsed.data);
    if (error) setFormError(error);
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <section className="modal-card invite-member-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">WORKSPACE ACCESS</span>
            <h2 id={headingId}>Invite a teammate</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="icon-button"
            onPress={onClose}
            isDisabled={pending}
            aria-label="Close invitation dialog"
          >
            <Icon name="close" />
          </Button>
        </div>

        <form className="modal-form" onSubmit={(event) => void submit(event)} noValidate>
          <div className="invite-dialog-field">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="teammate@company.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError("");
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? emailErrorId : undefined}
              disabled={pending}
            />
            {emailError && <p className="invite-field-error" id={emailErrorId} role="alert">{emailError}</p>}
          </div>

          <div className="invite-dialog-field">
            <Label htmlFor="invite-role">Workspace role</Label>
            <Select
              id="invite-role"
              ariaLabel="Workspace role"
              className="invite-role-select"
              value={role}
              onValueChange={(value) => setRole(value as CreateInvitationInput["role"])}
              isDisabled={pending}
              options={[
                { value: "MEMBER", label: "Member" },
                ...(allowAdmin ? [{ value: "ADMIN", label: "Admin" }] : []),
              ]}
            />
            {!allowAdmin && <p className="invite-dialog-note">Admins can invite members. Only workspace owners can invite admins.</p>}
          </div>

          <p className="invite-dialog-note">The invitation expires in 7 days. The invited person must verify and sign in with this email address to join.</p>
          {formError && <p className="workspace-form-alert" role="alert">{formError}</p>}

          <div className="modal-footer">
            <Button type="button" variant="ghost" className="button button-quiet" onPress={onClose} isDisabled={pending}>
              Cancel
            </Button>
            <Button type="submit" className="button button-primary" isDisabled={pending}>
              {pending ? "Sending…" : <><Icon name="send" size={15} /> Send invitation</>}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
