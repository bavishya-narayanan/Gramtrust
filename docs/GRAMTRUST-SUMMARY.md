# GramTrust Summary

## What is done

### Frontend
- Moved the React app into `frontend/` to keep the repo organized.
- Built a production-ready Vite + React 19 + TypeScript app.
- Added the required pages:
  - Dashboard
  - Projects
  - Project Details
  - Blockchain Verification
  - Integrity Report
  - Admin Panel
- Added reusable UI components and a shared app shell.
- Switched the frontend API client to call the real backend instead of the local mock ledger.

### Backend
- Added a modular Express + TypeScript backend inside `backend/`.
- Structured the backend with:
  - controllers
  - services
  - repositories
  - validators
  - middlewares
  - routes
- Implemented APIs for:
  - `GET /api/projects`
  - `GET /api/projects/:id`
  - `POST /api/projects/:id/verify`
  - `GET /api/projects/:id/transactions`
  - `POST /api/import`
  - `POST /api/blockchain/store`
  - `GET /api/blockchain/:id/history`
  - `POST /api/verify`
  - `GET /api/verify/report`
  - `GET /api/dashboard`
  - `POST /api/actions/import-dataset`
  - `POST /api/actions/store-records`
  - `POST /api/actions/simulate-tampering`
  - `POST /api/actions/verify-blockchain`
  - `GET /api/integrity-report`
- Added CSV import support, blockchain simulation, and integrity verification logic.

### Dataset
- Switched the app to use `datasets/NREGA.csv`.
- Updated the importer and seed logic to read the NREGA CSV format.
- Added support for seeding the backend database from the uploaded dataset.

### Database and Blockchain
- Added Prisma schema files and SQL schema files.
- Added blockchain scaffolding under `blockchain/`.
- Added Docker support for PostgreSQL and the backend.

### Validation
- Verified backend build successfully.
- Verified frontend build successfully.

## Where to place the CSV
- Put the uploaded dataset in `datasets/NREGA.csv`.
- The backend seed script reads from that file.
- The import endpoint also accepts a file upload through `POST /api/import`.

## Run commands

### Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run build
npm run dev
```

### Database seed
```bash
cd backend
npm run prisma:seed
```

## Notes
- The frontend and backend are now separated into their own folders.
- The app is no longer relying on static mock frontend data for the main flows.
- Some large frontend bundles still show a Vite size warning, but the build succeeds.
