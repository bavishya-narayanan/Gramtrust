# Architecture

GramTrust uses a modular backend architecture with clear separation between controllers, services, repositories, validators, and middleware.

## Layers

- Controllers expose HTTP endpoints and keep transport logic thin.
- Services own business rules for import, storage, and verification.
- Repositories isolate Prisma ORM access.
- Validators use Zod to guard request payloads.
- Middleware handles errors, request validation, and 404s.

## Data Flow

1. CSV data is uploaded through `POST /api/import`.
2. The import service parses the file and upserts projects.
3. Blockchain records are created with deterministic SHA-256 hashes.
4. Integrity verification compares database totals against blockchain history.
