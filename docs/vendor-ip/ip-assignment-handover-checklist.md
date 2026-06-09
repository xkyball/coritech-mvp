# IP Assignment and Handover Checklist

## Purpose

This checklist is used before signing any CoriTech Phase 1 vendor contract or
statement of work. It confirms that outsourced implementation, development,
documentation and design work can be performed without CoriTech losing
ownership, transferability or production handover control.

It applies to:

- Development agencies.
- Freelance developers and technical contractors.
- UX/UI designers, product designers and design studios.

## Control Rule

CoriTech may outsource execution, specialist setup and design production, but
CoriTech must own or have unrestricted production rights to all Phase 1
deliverables needed to operate, maintain, audit, transfer and fund the product.

No vendor may be the only practical owner of source code, design files,
documentation, deployment knowledge, production-critical accounts or production
secrets.

## Acceptable Outsourcing vs Ownership Loss

| Acceptable outsourcing | Unacceptable ownership loss |
| --- | --- |
| Vendor builds in a CoriTech-owned source-control organization or transfers complete source history before work is accepted. | Production code exists only in a vendor, agency, freelancer or personal repository. |
| Vendor configures managed infrastructure, auth, storage, email, CI/CD or deployment tooling under CoriTech-controlled accounts. | Vendor owns or is the only administrator for production-critical accounts. |
| Vendor uses approved open-source dependencies with disclosed licenses and replacement notes. | Vendor embeds undisclosed proprietary, copyleft-incompatible or non-transferable components. |
| Vendor receives time-limited access to CoriTech systems for delivery and support. | Vendor keeps persistent production access after handover without explicit written approval. |
| UX/UI designer works in a CoriTech-controlled design workspace or transfers editable design source files. | Product design, component files, prototypes, icons or assets remain only in a vendor-controlled workspace. |
| Vendor documents how to run, deploy, test and hand over the work. | CoriTech depends on undocumented vendor knowledge to operate or deploy the system. |
| Vendor stores secrets only in approved CoriTech-controlled channels while access is active. | Vendor retains production secrets in personal password managers, local files, chats or tickets after handover. |

## Pre-Signature Contract Checklist

Complete this checklist before signing a master services agreement, statement of
work, freelancer agreement, design agreement or purchase order.

| Item | Required control | Applies to | Evidence before signing | Status |
| --- | --- | --- | --- | --- |
| Vendor role identified | Contract states whether the vendor is a development agency, freelancer, UX/UI designer, design studio or mixed-role supplier. | Agency, freelancer, designer | Draft contract or statement of work with vendor role and named contributors where applicable | `[PENDING_CONTRACT_REVIEW]` |
| Deliverable ownership | CoriTech owns all paid deliverables or receives an irrevocable, worldwide, transferable, sublicensable license for unrestricted product use. | Agency, freelancer, designer | Ownership clause covering source code, documentation, designs, assets and configuration | `[PENDING_CONTRACT_REVIEW]` |
| IP assignment | Vendor assigns deliverable IP to CoriTech on creation or payment, with contributor assignment obligations for employees and subcontractors. | Agency, freelancer, designer | IP assignment or work-for-hire clause, subcontractor flow-down wording | `[PENDING_CONTRACT_REVIEW]` |
| Background IP disclosure | Vendor discloses pre-existing tools, templates, libraries, design systems, snippets or assets before use. | Agency, freelancer, designer | Background IP schedule with permitted use and replacement notes | `[PENDING_DISCLOSURE]` |
| Source-code delivery | Code is committed to a CoriTech-owned repository with usable history, branch metadata and build instructions. | Agency, freelancer | Repository location, delivery cadence, commit access plan, acceptance branch rules | `[PENDING_REPO_CONFIRMATION]` |
| Repository ownership | Production source is not dependent on a personal, freelancer or agency-owned repository. | Agency, freelancer | Link to `docs/source-control/repository-ownership.md` evidence requirements | `[PENDING_REPO_CONFIRMATION]` |
| Documentation delivery | Vendor must provide setup, local run, deployment, testing, architecture and operational handover documentation for delivered work. | Agency, freelancer, designer | Documentation deliverables listed in the statement of work | `[PENDING_SOW_REVIEW]` |
| Dependency list | Vendor must maintain a list of runtime, build, design and deployment dependencies with versions, licenses and owners. | Agency, freelancer, designer | Dependency list deliverable, license disclosure requirement | `[PENDING_DISCLOSURE]` |
| Open-source disclosure | All open-source dependencies and license obligations must be disclosed before acceptance. | Agency, freelancer | License disclosure schedule, package inventory, replacement notes for risky licenses | `[PENDING_DISCLOSURE]` |
| Design file transfer | Editable source design files, prototypes, exported assets, fonts, icon sets and component libraries must be transferred or housed in a CoriTech-controlled workspace. | Designer, agency | Design workspace ownership evidence, export format, font/license list | `[PENDING_DESIGN_TRANSFER]` |
| Deployment knowledge transfer | Vendor must document deployment steps, environment assumptions, rollback notes and production access boundaries. | Agency, freelancer | Deployment runbook deliverable, handover session requirement | `[PENDING_SOW_REVIEW]` |
| Account ownership | Production-critical accounts must be CoriTech-controlled or transferable before production use. | Agency, freelancer, designer | Link to `docs/vendor-ip/account-ownership-checklist.md` evidence requirements | `[PENDING_ACCOUNT_REVIEW]` |
| Secrets handling | Vendor may not retain production secrets after handover; secrets must be stored only in approved CoriTech-controlled channels and rotated when access ends. | Agency, freelancer, designer | Secrets clause, access termination process, rotation owner | `[PENDING_SECURITY_REVIEW]` |
| Confidentiality | Vendor must protect product plans, breeder/station data, documents, workflows, credentials and diligence materials. | Agency, freelancer, designer | NDA or confidentiality clause covering CoriTech data and deliverables | `[PENDING_CONTRACT_REVIEW]` |
| Subcontractor control | Vendor may not use subcontractors without disclosure and equivalent IP, confidentiality and handover obligations. | Agency, designer | Subcontractor approval clause and contributor assignment evidence | `[PENDING_CONTRACT_REVIEW]` |
| Handover package | Final acceptance requires source, documentation, design files, dependency list, account/access notes and open issue list. | Agency, freelancer, designer | Handover deliverables listed as acceptance criteria in the contract or SOW | `[PENDING_SOW_REVIEW]` |
| Exit support | Vendor must provide a defined support window for transfer, walkthroughs, questions and access removal. | Agency, freelancer, designer | Exit support period, response time, named handover contact | `[PENDING_SOW_REVIEW]` |
| Production access removal | Vendor production access must be removed or explicitly reapproved after handover and support completion. | Agency, freelancer, designer | Access review requirement, owner for offboarding evidence | `[PENDING_SECURITY_REVIEW]` |

## Handover Acceptance Checklist

Use this checklist before accepting final delivery, paying final milestones or
ending vendor access.

| Item | Acceptance evidence | Status |
| --- | --- | --- |
| Source code delivered in CoriTech-owned repository | Repository URL, commit history, branch protection evidence and final release tag or handover branch | `[PENDING_EVIDENCE]` |
| Build and test instructions delivered | Current README or setup guide proving a non-vendor operator can run the work | `[PENDING_EVIDENCE]` |
| Deployment runbook delivered | Environment list, deployment steps, rollback notes and ownership boundaries | `[PENDING_EVIDENCE]` |
| Documentation delivered | Architecture notes, operational notes, configuration assumptions and known limitations | `[PENDING_EVIDENCE]` |
| Dependency and license list delivered | Runtime, build, infrastructure and design dependencies with versions and license notes | `[PENDING_EVIDENCE]` |
| Open-source obligations disclosed | License obligations, notices and replacement notes where needed | `[PENDING_EVIDENCE]` |
| Background IP schedule confirmed | Pre-existing vendor IP, third-party assets and usage rights documented | `[PENDING_EVIDENCE]` |
| Editable design files transferred | Source design files, prototypes, components, exports, fonts and asset licenses transferred or confirmed in CoriTech workspace | `[PENDING_EVIDENCE]` |
| Production secrets removed from vendor control | Access removed, secrets rotated where needed, no local/vendor-channel retention confirmed | `[PENDING_EVIDENCE]` |
| Production-critical account control confirmed | Account ownership checklist updated for affected systems | `[PENDING_EVIDENCE]` |
| Exit support completed | Walkthrough date, handover recording or notes, open issue list and support contact confirmed | `[PENDING_EVIDENCE]` |

## Status Values

| Status | Meaning |
| --- | --- |
| `[PENDING_CONTRACT_REVIEW]` | Legal or commercial wording is not yet confirmed. |
| `[PENDING_SOW_REVIEW]` | Statement-of-work wording or acceptance criteria are not yet confirmed. |
| `[PENDING_DISCLOSURE]` | Vendor disclosure is required before signing or accepting delivery. |
| `[PENDING_REPO_CONFIRMATION]` | Source-control owner, location or delivery path is not yet confirmed. |
| `[PENDING_ACCOUNT_REVIEW]` | Production-critical account control must be checked against the account ownership checklist. |
| `[PENDING_DESIGN_TRANSFER]` | Design workspace ownership or file transfer path is not yet confirmed. |
| `[PENDING_SECURITY_REVIEW]` | Secrets, confidentiality or access removal controls need review. |
| `[PENDING_EVIDENCE]` | Required handover evidence has not yet been attached. |
| `[CONFIRMED]` | Requirement is satisfied and supporting evidence is attached. |
| `[EXCEPTION_REVIEW_REQUIRED]` | Requirement is not satisfied and must be approved before signing or accepting delivery. |

## Review Cadence

- Review before vendor contract signature.
- Review at kickoff before granting repository, design workspace or production
  system access.
- Review before final milestone payment or final delivery acceptance.
- Review before removing vendor access after exit support.

Any exception must name a CoriTech owner, state the commercial reason, define a
transfer or replacement path and be resolved before production-critical use.
