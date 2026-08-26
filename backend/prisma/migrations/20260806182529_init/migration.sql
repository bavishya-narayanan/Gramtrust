-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Pending', 'In Progress', 'Under Review', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "BlockchainStatus" AS ENUM ('Not Stored', 'Stored', 'Tampered', 'Verified', 'Failed');

-- CreateEnum
CREATE TYPE "IntegrityStatus" AS ENUM ('Pending', 'Valid', 'Mismatch', 'Error');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Confirmed', 'Failed', 'Reverted');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('Success', 'Partial', 'Failed');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'auditor', 'viewer', 'panchayat_officer');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('Open', 'Under Investigation', 'Resolved', 'Closed', 'Rejected');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "district" TEXT,
    "state" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "projects" (
    "project_id" TEXT NOT NULL,
    "project_code" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "financial_year" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'Pending',
    "blockchain_status" "BlockchainStatus" NOT NULL DEFAULT 'Not Stored',
    "blockchain_hash" TEXT,
    "integrity_status" "IntegrityStatus" NOT NULL DEFAULT 'Pending',
    "imported_by" TEXT,
    "raw_csv_row" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "blockchain_transactions" (
    "transaction_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "hash" TEXT NOT NULL,
    "previous_hash" TEXT,
    "action" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'Pending',
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "import_logs" (
    "import_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "import_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'Success',
    "error_details" JSONB,
    "imported_by" TEXT,
    "file_size_bytes" BIGINT,
    "checksum_sha256" TEXT,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("import_id")
);

-- CreateTable
CREATE TABLE "integrity_audits" (
    "audit_id" TEXT NOT NULL,
    "project_id" TEXT,
    "database_amount" DECIMAL(18,2) NOT NULL,
    "blockchain_amount" DECIMAL(18,2) NOT NULL,
    "status" "IntegrityStatus" NOT NULL,
    "notes" JSONB,
    "audited_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrity_audits_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "complaint_id" TEXT NOT NULL,
    "project_id" TEXT,
    "filed_by" TEXT,
    "assigned_to" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'Medium',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'Open',
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("complaint_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_district_idx" ON "users"("district");

-- CreateIndex
CREATE INDEX "users_state_idx" ON "users"("state");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "projects_state_idx" ON "projects"("state");

-- CreateIndex
CREATE INDEX "projects_district_idx" ON "projects"("district");

-- CreateIndex
CREATE INDEX "projects_financial_year_idx" ON "projects"("financial_year");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_blockchain_status_idx" ON "projects"("blockchain_status");

-- CreateIndex
CREATE INDEX "projects_integrity_status_idx" ON "projects"("integrity_status");

-- CreateIndex
CREATE INDEX "projects_imported_by_idx" ON "projects"("imported_by");

-- CreateIndex
CREATE INDEX "projects_state_financial_year_idx" ON "projects"("state", "financial_year");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_code_financial_year_key" ON "projects"("project_code", "financial_year");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_hash_key" ON "blockchain_transactions"("hash");

-- CreateIndex
CREATE INDEX "blockchain_transactions_project_id_idx" ON "blockchain_transactions"("project_id");

-- CreateIndex
CREATE INDEX "blockchain_transactions_block_number_idx" ON "blockchain_transactions"("block_number");

-- CreateIndex
CREATE INDEX "blockchain_transactions_status_idx" ON "blockchain_transactions"("status");

-- CreateIndex
CREATE INDEX "blockchain_transactions_created_at_idx" ON "blockchain_transactions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "blockchain_transactions_project_id_block_number_idx" ON "blockchain_transactions"("project_id", "block_number" DESC);

-- CreateIndex
CREATE INDEX "import_logs_import_date_idx" ON "import_logs"("import_date" DESC);

-- CreateIndex
CREATE INDEX "import_logs_status_idx" ON "import_logs"("status");

-- CreateIndex
CREATE INDEX "import_logs_imported_by_idx" ON "import_logs"("imported_by");

-- CreateIndex
CREATE INDEX "import_logs_checksum_sha256_idx" ON "import_logs"("checksum_sha256");

-- CreateIndex
CREATE INDEX "integrity_audits_project_id_idx" ON "integrity_audits"("project_id");

-- CreateIndex
CREATE INDEX "integrity_audits_status_idx" ON "integrity_audits"("status");

-- CreateIndex
CREATE INDEX "integrity_audits_created_at_idx" ON "integrity_audits"("created_at" DESC);

-- CreateIndex
CREATE INDEX "complaints_project_id_idx" ON "complaints"("project_id");

-- CreateIndex
CREATE INDEX "complaints_filed_by_idx" ON "complaints"("filed_by");

-- CreateIndex
CREATE INDEX "complaints_assigned_to_idx" ON "complaints"("assigned_to");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "complaints_priority_idx" ON "complaints"("priority");

-- CreateIndex
CREATE INDEX "complaints_created_at_idx" ON "complaints"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_transactions" ADD CONSTRAINT "blockchain_transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrity_audits" ADD CONSTRAINT "integrity_audits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrity_audits" ADD CONSTRAINT "integrity_audits_audited_by_fkey" FOREIGN KEY ("audited_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_filed_by_fkey" FOREIGN KEY ("filed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
