# Object Storage Foundation

## Purpose

CoriTech uses commodity S3-compatible object storage for document bytes while
the application owns document access logic, metadata, audit hooks and proof-layer
decisions.

This prerequisite adds MinIO for local development before Ticket 6.1 integrates
document uploads.

## Local Provider

Local development uses MinIO through Docker Compose:

| Setting | Local value |
| --- | --- |
| API endpoint inside Compose | `http://minio:9000` |
| API endpoint from host machine | `http://localhost:9000` |
| Console | `http://localhost:9001` |
| Bucket | `coritech-local-dev` |
| Provider selector | `minio` |
| Region label | `local-dev` |

The `minio-init` service creates the configured bucket and keeps anonymous
access disabled. The bucket is private by default.

## Environment Contract

Required variables:

```env
OBJECT_STORAGE_PROVIDER=minio
OBJECT_STORAGE_ENDPOINT=localhost
OBJECT_STORAGE_PORT=9000
OBJECT_STORAGE_USE_SSL=false
OBJECT_STORAGE_BUCKET=coritech-local-dev
OBJECT_STORAGE_REGION=local-dev
OBJECT_STORAGE_ACCESS_KEY=coritech_minio_dev
OBJECT_STORAGE_SECRET_KEY=coritech_minio_dev_password
```

Staging and production should keep the same variable names, but values must come
from a CoriTech-controlled secret manager or future vault.

## Provider Abstraction

The reusable storage foundation lives in
`packages/domain/src/storage/object-storage.mjs`.

Ticket 6.1 should:

- load the shared environment config;
- create object storage config through `createObjectStorageConfig`;
- initialize the selected S3-compatible SDK using CoriTech-controlled
  credentials;
- wrap the SDK with the object-storage provider abstraction;
- write document upload, metadata, validation, controlled-access and audit logic
  outside the storage provider.

The provider abstraction supports infrastructure-level object operations:

- put object;
- get object;
- delete object;
- head object;
- object exists;
- infrastructure-level presigned GET URL delegation when the injected SDK
  supports it.

## Security and Ownership

- No production credentials are committed.
- Local MinIO credentials are development-only and must not be reused for
  staging or production.
- Buckets must remain private by default.
- Raw public document links must not be exposed.
- Production object storage accounts, buckets, access keys, backup
  administrators and recovery paths must be CoriTech-controlled.
- Vendor-owned production-critical account assumptions are not accepted without
  an explicit documented exception.

## Known Limitation

This prerequisite does not implement document upload endpoints, document
metadata persistence, controlled access URLs, upload/view audit hooks, file type
validation, file size validation, malware scanning placeholder behavior,
document authorization logic, buyer access rules, public sharing, AI,
blockchain/token logic or federation automation. Those remain Ticket 6.1 or
future ticket responsibilities.
