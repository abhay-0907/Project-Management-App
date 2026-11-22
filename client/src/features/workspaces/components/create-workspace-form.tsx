"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/shared/icon";
import { WorkspaceApiError } from "../api/workspace.api";
import {
  createWorkspaceSchema,
  slugifyWorkspaceName,
} from "../schemas/workspace.schema";
import { useCreateWorkspace } from "../hooks/use-create-workspace";

type FormField = "name" | "slug";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const createWorkspace = useCreateWorkspace();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createWorkspaceSchema.safeParse({ name, slug });
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({ name: errors.name?.[0], slug: errors.slug?.[0] });
      return;
    }

    setFieldErrors({});
    createWorkspace.mutate(parsed.data, {
      onSuccess: ({ workspace }) => {
        router.replace(`/${workspace.slug}`);
        router.refresh();
      },
    });
  }

  const duplicateSlug =
    createWorkspace.error instanceof WorkspaceApiError &&
    createWorkspace.error.status === 409;
  const needsSignIn =
    createWorkspace.error instanceof WorkspaceApiError &&
    createWorkspace.error.status === 401;

  return (
    <main className="invite-page workspace-create-page">
      <section className="modal-card onboarding-form-card workspace-create-card">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">A NEW TEAM SPACE</span>
            <h1>Create your workspace</h1>
          </div>
          <Link href="/workspaces" className="icon-button" aria-label="Back to workspaces">
            <Icon name="close" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <p className="onboarding-form-description">
            Give your team a home for projects, members, and shared progress.
          </p>

          <label className="field-label" htmlFor="workspace-name">
            Workspace name
            <input
              id="workspace-name"
              autoFocus
              autoComplete="organization"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugEdited) setSlug(slugifyWorkspaceName(nextName));
                setFieldErrors((current) => ({ ...current, name: undefined }));
                createWorkspace.reset();
              }}
              placeholder="e.g. Product & Design"
              maxLength={150}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "workspace-name-error" : undefined}
            />
            {fieldErrors.name && (
              <small id="workspace-name-error" className="workspace-field-error">
                {fieldErrors.name}
              </small>
            )}
          </label>

          <label className="field-label" htmlFor="workspace-slug">
            Workspace URL
            <span className={`slug-input ${fieldErrors.slug || duplicateSlug ? "has-error" : ""}`}>
              <span>nexora.app/</span>
              <input
                id="workspace-slug"
                autoComplete="off"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value.toLowerCase());
                  setSlugEdited(true);
                  setFieldErrors((current) => ({ ...current, slug: undefined }));
                  createWorkspace.reset();
                }}
                placeholder="your-workspace"
                maxLength={100}
                aria-invalid={Boolean(fieldErrors.slug || duplicateSlug)}
                aria-describedby={
                  fieldErrors.slug || duplicateSlug
                    ? "workspace-slug-error"
                    : "workspace-slug-help"
                }
              />
            </span>
            {fieldErrors.slug ? (
              <small id="workspace-slug-error" className="workspace-field-error">
                {fieldErrors.slug}
              </small>
            ) : duplicateSlug ? (
              <small id="workspace-slug-error" className="workspace-field-error">
                That workspace URL is already in use. Choose another one.
              </small>
            ) : (
              <small id="workspace-slug-help">
                Use lowercase letters, numbers, and hyphens.
              </small>
            )}
          </label>

          {createWorkspace.error && !duplicateSlug && (
            <div className="workspace-form-alert" role="alert">
              {needsSignIn ? (
                <>
                  Sign in to create a workspace. <Link href="/login">Go to sign in</Link>
                </>
              ) : (
                createWorkspace.error.message
              )}
            </div>
          )}

          <div className="workspace-owner-note">
            <span className="workspace-role-mark"><Icon name="shield" size={15} /></span>
            <span>
              <strong>You’ll be the workspace owner</strong>
              <small>Owner access is assigned automatically when the workspace is created.</small>
            </span>
          </div>

          <div className="modal-footer">
            <Link href="/workspaces" className="button button-quiet">Cancel</Link>
            <button
              type="submit"
              className="button button-primary"
              disabled={createWorkspace.isPending}
            >
              {createWorkspace.isPending ? (
                <><span className="workspace-spinner" aria-hidden="true" /> Creating…</>
              ) : (
                <>Create workspace <Icon name="arrow-right" size={15} /></>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
