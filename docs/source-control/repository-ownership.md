# Repository Ownership Record

## Purpose

This record documents the source-control ownership evidence needed for technical
due diligence and repository transferability.

## Required Ownership State

| Control | Required value | Current evidence |
| --- | --- | --- |
| Source-control organization | `[CORITECH_CONTROLLED_ORGANIZATION]` | `[PENDING_EXTERNAL_CONFIGURATION]` |
| Repository name | `[CORITECH_REPOSITORY_NAME]` | `[PENDING_EXTERNAL_CONFIGURATION]` |
| Legal or operating owner | CoriTech | `[PENDING_CONFIRMATION]` |
| Primary admin | `[CORITECH_PRIMARY_ADMIN]` | `[PENDING_CONFIRMATION]` |
| Backup admin | `[CORITECH_BACKUP_ADMIN]` | `[PENDING_CONFIRMATION]` |
| Personal-only repository dependency | Not allowed | `[PENDING_CONFIRMATION]` |
| Agency-owned production-critical dependency | Not allowed | `[PENDING_CONFIRMATION]` |
| Observed local remote | Must resolve to CoriTech-controlled organization before acceptance | `https://github.com/xkyball/coritech-mvp.git` observed locally; not sufficient ownership proof |

## Due-Diligence Evidence Pack

Store or link the following evidence in the selected source-control platform or
data room:

- Organization ownership screenshot or export showing CoriTech control.
- Repository settings screenshot or export showing the repository under the
  CoriTech-controlled organization.
- Administrator list showing a CoriTech primary admin and at least one CoriTech
  backup admin.
- Branch protection evidence for `main`.
- Pull-request requirement evidence for `main`.
- CODEOWNERS or required-reviewer evidence.
- Branch protection and review policy evidence described in
  `docs/source-control/branch-protection.md`.
- Repository transfer or access continuity notes, if applicable.

## Current Local Note

The local Git remote is not sufficient proof of CoriTech ownership. The observed
remote at implementation time points to `https://github.com/xkyball/coritech-mvp.git`.
Before this repository is used as an investor or production evidence source,
replace or confirm the remote under a CoriTech-controlled source-control
organization and attach the evidence listed above.

## Review Cadence

Review this record at each funding diligence checkpoint, before granting new
admin access, and before production launch.
