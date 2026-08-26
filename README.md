# GramTrust

GramTrust is a blockchain-based Panchayat transparency platform focused on the immutable fund ledger.

## Repository Layout

- `frontend/` contains the Vite React app
- `backend/` Express + Prisma + PostgreSQL API
- `blockchain/` chaincode and gateway scaffolding
- `database/` SQL and Prisma schema assets
- `datasets/` seed CSV files
- `docs/` architecture and API notes

## Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run build
npm run dev
```

Set `DATABASE_URL` in `backend/.env` before running migrations or seeding.

To load the uploaded `NREGA.csv` dataset, place it in `datasets/` for local seeding or upload it to `POST /api/import` as multipart form-data with a `file` field.

## Root Docker Compose

```bash
docker compose up --build
```

The compose file starts PostgreSQL and the backend service.
