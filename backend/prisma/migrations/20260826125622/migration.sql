/*
  Warnings:

  - The values [Under Investigation] on the enum `ComplaintStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [admin,auditor,viewer,panchayat_officer] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `complaints` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `complaint_id` on the `complaints` table. All the data in the column will be lost.
  - The primary key for the `import_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `import_id` on the `import_logs` table. All the data in the column will be lost.
  - The primary key for the `integrity_audits` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `audit_id` on the `integrity_audits` table. All the data in the column will be lost.
  - You are about to drop the column `audited_by` on the `integrity_audits` table. All the data in the column will be lost.
  - The primary key for the `projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `financial_year` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `imported_by` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_code` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_name` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `raw_csv_row` on the `projects` table. All the data in the column will be lost.
  - The `blockchain_status` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `integrity_status` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `blockchain_transactions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `complaints` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `import_logs` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `difference` to the `integrity_audits` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `integrity_audits` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `status` on the `integrity_audits` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `code` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `financialYear` to the `projects` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `projects` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - The required column `id` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ComplaintStatus_new" AS ENUM ('Open', 'UnderInvestigation', 'Resolved', 'Closed', 'Rejected');
ALTER TABLE "public"."complaints" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "complaints" ALTER COLUMN "status" TYPE "ComplaintStatus_new" USING ("status"::text::"ComplaintStatus_new");
ALTER TYPE "ComplaintStatus" RENAME TO "ComplaintStatus_old";
ALTER TYPE "ComplaintStatus_new" RENAME TO "ComplaintStatus";
DROP TYPE "public"."ComplaintStatus_old";
ALTER TABLE "complaints" ALTER COLUMN "status" SET DEFAULT 'Open';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'OFFICIAL', 'CITIZEN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CITIZEN';
COMMIT;

-- DropForeignKey
ALTER TABLE "blockchain_transactions" DROP CONSTRAINT "blockchain_transactions_project_id_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_filed_by_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_project_id_fkey";

-- DropForeignKey
ALTER TABLE "import_logs" DROP CONSTRAINT "import_logs_imported_by_fkey";

-- DropForeignKey
ALTER TABLE "integrity_audits" DROP CONSTRAINT "integrity_audits_audited_by_fkey";

-- DropForeignKey
ALTER TABLE "integrity_audits" DROP CONSTRAINT "integrity_audits_project_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_imported_by_fkey";

-- DropIndex
DROP INDEX "complaints_assigned_to_idx";

-- DropIndex
DROP INDEX "import_logs_checksum_sha256_idx";

-- DropIndex
DROP INDEX "import_logs_imported_by_idx";

-- DropIndex
DROP INDEX "projects_financial_year_idx";

-- DropIndex
DROP INDEX "projects_imported_by_idx";

-- DropIndex
DROP INDEX "projects_project_code_financial_year_key";

-- DropIndex
DROP INDEX "projects_state_financial_year_idx";

-- DropIndex
DROP INDEX "users_is_active_idx";

-- AlterTable
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_pkey",
DROP COLUMN "complaint_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "complaints_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "import_logs" DROP CONSTRAINT "import_logs_pkey",
DROP COLUMN "import_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "integrity_audits" DROP CONSTRAINT "integrity_audits_pkey",
DROP COLUMN "audit_id",
DROP COLUMN "audited_by",
ADD COLUMN     "difference" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
ADD CONSTRAINT "integrity_audits_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "projects" DROP CONSTRAINT "projects_pkey",
DROP COLUMN "financial_year",
DROP COLUMN "imported_by",
DROP COLUMN "project_code",
DROP COLUMN "project_id",
DROP COLUMN "project_name",
DROP COLUMN "raw_csv_row",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "financialYear" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
DROP COLUMN "blockchain_status",
ADD COLUMN     "blockchain_status" TEXT NOT NULL DEFAULT 'Pending',
DROP COLUMN "integrity_status",
ADD COLUMN     "integrity_status" TEXT NOT NULL DEFAULT 'Review Required',
ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "id" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'CITIZEN',
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "blockchain_transactions";

-- DropEnum
DROP TYPE "BlockchainStatus";

-- DropEnum
DROP TYPE "IntegrityStatus";

-- DropEnum
DROP TYPE "ProjectStatus";

-- DropEnum
DROP TYPE "TransactionStatus";

-- CreateTable
CREATE TABLE "blockchain_records" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_records_tx_hash_key" ON "blockchain_records"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_records_project_id_idx" ON "blockchain_records"("project_id");

-- CreateIndex
CREATE INDEX "blockchain_records_created_at_idx" ON "blockchain_records"("created_at" DESC);

-- CreateIndex
CREATE INDEX "integrity_audits_status_idx" ON "integrity_audits"("status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_financialYear_idx" ON "projects"("financialYear");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_blockchain_status_idx" ON "projects"("blockchain_status");

-- CreateIndex
CREATE INDEX "projects_integrity_status_idx" ON "projects"("integrity_status");

-- AddForeignKey
ALTER TABLE "blockchain_records" ADD CONSTRAINT "blockchain_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrity_audits" ADD CONSTRAINT "integrity_audits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_filed_by_fkey" FOREIGN KEY ("filed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
