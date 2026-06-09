# Branch Protection Baseline

## Protected Branch

`main`

## Required Controls

The selected source-control platform must enforce the following controls before
production-critical work starts:

- Pull requests are required before merge.
- At least one CoriTech-approved reviewer is required.
- CODEOWNERS or equivalent ownership review is required for owned paths.
- Direct pushes to `main` are blocked.
- Force pushes to `main` are blocked.
- Branch deletion for `main` is blocked.
- Required checks must pass before merge once checks exist.
- Administrator bypasses are disabled or formally documented.

## Evidence Checklist

| Control | Status | Evidence location |
| --- | --- | --- |
| `main` branch protection active | `[PENDING_EXTERNAL_CONFIGURATION]` | `[ADD_LINK_OR_SCREENSHOT_REFERENCE]` |
| Pull requests required | `[PENDING_EXTERNAL_CONFIGURATION]` | `[ADD_LINK_OR_SCREENSHOT_REFERENCE]` |
| Required reviewers configured | `[PENDING_EXTERNAL_CONFIGURATION]` | `[ADD_LINK_OR_SCREENSHOT_REFERENCE]` |
| CODEOWNERS or equivalent review configured | `[PENDING_EXTERNAL_CONFIGURATION]` | `[ADD_LINK_OR_SCREENSHOT_REFERENCE]` |
| Direct pushes blocked | `[PENDING_EXTERNAL_CONFIGURATION]` | `[ADD_LINK_OR_SCREENSHOT_REFERENCE]` |
| Force pushes blocked | `[PENDING_EXTERNAL_CONFIGURATION]` | `[ADD_LINK_OR_SCREENSHOT_REFERENCE]` |
| Backup admin access verified | `[PENDING_EXTERNAL_CONFIGURATION]` | `[ADD_LINK_OR_SCREENSHOT_REFERENCE]` |

## Implementation Note

This repository contains the policy and template files required for setup. The
actual branch protection settings must be enabled in the selected
source-control platform by a CoriTech administrator.
