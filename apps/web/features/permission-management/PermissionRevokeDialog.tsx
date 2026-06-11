"use client";

import { useId, useRef } from "react";

import {
  Button,
  ConfirmationDialog,
  Field,
  Textarea,
} from "../../components/ui";

export function PermissionRevokeDialog({
  permissionId,
  revokeAction,
}: Readonly<{
  permissionId: string;
  revokeAction: (formData: FormData) => void | Promise<void>;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reasonId = useId();

  return (
    <>
      <Button onClick={() => dialogRef.current?.showModal()} type="button" variant="danger">
        Revoke
      </Button>
      <ConfirmationDialog
        action={revokeAction}
        confirmLabel="Revoke permission"
        description="This removes the active grant and records the revocation in the audit log."
        dialogRef={dialogRef}
        hiddenFields={[{ name: "permissionId", value: permissionId }]}
        id={`revoke-permission-${permissionId}`}
        title="Revoke permission"
      >
        <Field htmlFor={reasonId} label="Revocation reason">
          <Textarea
            id={reasonId}
            name="revocationReason"
            required
            rows={3}
          />
        </Field>
      </ConfirmationDialog>
    </>
  );
}
