# CoriTech App

This directory contains Phase 1 frontend modules introduced by approved tickets.

## Implemented Modules

- `breeder-dashboard/` - Ticket 3.1 breeder dashboard view model, HTML renderer
  and styles for a breeder organization's catalog, order, document and
  action-required overview.

## Guardrails

Frontend code in this directory must continue to use managed auth context and
role-based server contracts from `api/domain/`. It must not add custom
authentication, public document links, AI claims, blockchain/token logic, full
marketplace automation, federation automation, sensor ingestion or unrestricted
buyer access unless a later approved ticket explicitly changes the scope.
