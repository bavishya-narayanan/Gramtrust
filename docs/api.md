# API Reference

## Projects

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/verify`
- `GET /api/projects/:id/transactions`

## Import

- `POST /api/import`

Accepts either a multipart file named `file` or a JSON body containing `csvText`.

## Blockchain

- `POST /api/blockchain/store`
- `GET /api/blockchain/:id/history`

The store endpoint accepts an optional `projectCode`. Without it, the API stores all current projects.

## Verification

- `POST /api/verify`
- `GET /api/verify/report`

The verify endpoint accepts an optional `projectCode`. Without it, the API verifies the entire dataset.
