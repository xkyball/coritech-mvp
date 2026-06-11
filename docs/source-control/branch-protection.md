# Branch Protection and Review Policy

## Purpose

Ticket 0.1 requires a CoriTech-controlled source repository with protected
`main`, pull-request review before merge and due-diligence evidence.

Repository settings are controlled by the source-control provider and cannot be
verified from local files alone. This document defines the required settings and
the evidence that must be attached once the repository is under a confirmed
CoriTech-controlled organization.

## Required `main` Protection

Configure the default branch `main` with:

- pull request required before merge;
- at least one approving review from a CoriTech-controlled maintainer;
- CODEOWNERS review required after `.github/CODEOWNERS` is updated with real
  CoriTech teams;
- stale approvals dismissed when relevant files change;
- conversation resolution required before merge;
- CI workflow `CI / Install, lint, typecheck, test and build` required to pass;
- direct pushes to `main` blocked for normal contributors;
- force pushes disabled;
- branch deletion disabled;
- administrator bypass restricted to named CoriTech admins only.

## Current Local Evidence

Observed local remote at implementation time:

```text
origin https://github.com/xkyball/coritech-mvp.git
```

This remote is not sufficient proof of CoriTech-controlled ownership. Before
this repository is used as production or investor-diligence evidence, the
repository must be transferred to or recreated under a CoriTech-controlled
GitHub/GitLab/Bitbucket organization, and the evidence listed below must be
attached.

## Required DD Evidence

| Evidence | Status |
| --- | --- |
| CoriTech-controlled organization owner export | `[PENDING_EXTERNAL_CONFIGURATION]` |
| Repository under CoriTech-controlled organization | `[PENDING_EXTERNAL_CONFIGURATION]` |
| Primary CoriTech admin named | `[PENDING_CONFIRMATION]` |
| Backup CoriTech admin named | `[PENDING_CONFIRMATION]` |
| Branch protection export for `main` | `[PENDING_EXTERNAL_CONFIGURATION]` |
| Pull-request requirement export | `[PENDING_EXTERNAL_CONFIGURATION]` |
| Required reviewer/CODEOWNERS export | `[PENDING_EXTERNAL_CONFIGURATION]` |
| Latest CI run evidence | GitHub Actions workflow exists; live run evidence pending |

## Handover Rule

No product code, configuration or documentation should exist only in a personal
or agency-owned repository. If implementation work starts in a personal
repository, CoriTech must receive the full source history, issue/PR context,
branch protection settings and admin access evidence before the repository is
treated as controlled.
