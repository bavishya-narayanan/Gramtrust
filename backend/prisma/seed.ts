import { config } from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNregaCsv } from '../src/utils/csv.js';
import { versionService } from '../src/services/version.service.js';
import { KaggleProcurementAdapter } from '../src/adapters/kaggle-procurement.adapter.js';
import bcrypt from 'bcryptjs';

config();

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const nregaCsvPath = join(__dirname, '../../datasets/NREGA.csv');
const procurementCsvPath = join(__dirname, '../../datasets/procurement_tenders.csv');

async function seedUsers() {
  console.log('🔐 Seeding users...');

  const users = [
    {
      email: 'admin@gramtrust.gov',
      name: 'GramTrust Admin',
      password: 'Admin@123',
      role: 'ADMIN' as const,
    },
    {
      email: 'official@gramtrust.gov',
      name: 'Panchayat Official',
      password: 'Official@123',
      role: 'OFFICIAL' as const,
    },
    {
      email: 'auditor@gramtrust.gov',
      name: 'Panchayat Auditor & Vigilance',
      password: 'Auditor@123',
      role: 'AUDITOR' as const,
    },
    {
      email: 'citizen@gramtrust.gov',
      name: 'Aarav Sharma',
      password: 'Citizen@123',
      role: 'CITIZEN' as const,
    },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, role: user.role, isActive: true, name: user.name },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        isActive: true,
      },
    });
    console.log(`  ✅ ${user.role}: ${user.email}`);
  }
}

async function seedTenders() {
  console.log('📋 Seeding procurement tenders from Kaggle CSV dataset...');
  try {
    const rawCsvContent = await readFile(procurementCsvPath, 'utf8');

    // Clean existing tender records for fresh reproducible seed
    await prisma.blockchainTransaction.deleteMany();
    await prisma.tenderAuditEvent.deleteMany();
    await prisma.bidVersion.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.vendorVersion.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.tenderVersion.deleteMany();
    await prisma.tender.deleteMany();
    await prisma.sourceSnapshot.deleteMany();

    const adapter = new KaggleProcurementAdapter();
    const tenders = await adapter.importDataset(rawCsvContent, 'csv');

    console.log(`  Parsed ${tenders.length} tenders from CSV...`);

    let imported = 0;
    let skipped = 0;
    for (const rawRecord of tenders) {
      try {
        await versionService.importTender(rawRecord, {
          sourceName: 'Kaggle Indian Government Procurement Dataset (CSV)',
          sourceUrl: 'https://www.kaggle.com/datasets/indian-government-procurement',
        });
        imported++;
        if (imported % 50 === 0) {
          console.log(`  ↳ Progress: ${imported}/${tenders.length} tenders imported...`);
        }
      } catch (err: any) {
        if (err?.message?.includes('already imported')) {
          skipped++;
        } else {
          console.warn(`  ⚠ Could not import ${rawRecord.tenderId}: ${err?.message}`);
        }
      }
    }
    console.log(`  ✅ Imported ${imported} tenders (skipped ${skipped} duplicates)`);
  } catch (err) {
    console.error('Error seeding tenders:', err);
  }
}

async function seedLegacyProjects() {
  console.log('📊 Seeding legacy NREGA projects...');
  try {
    const csvContent = await readFile(nregaCsvPath, 'utf8');
    const rows = parseNregaCsv(csvContent);

    await prisma.blockchainRecord.deleteMany();
    await prisma.integrityAudit.deleteMany();
    await prisma.project.deleteMany();

    for (const [index, row] of rows.entries()) {
      const code = `${row.state_name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${row.district_name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${String(index + 1).padStart(4, '0')}`;

      const project = await prisma.project.create({
        data: {
          code,
          name: `NREGA Works - ${row.district_name.trim()}`,
          district: row.district_name.trim(),
          state: row.state_name.trim(),
          financialYear: 'NREGA',
          amount: new Prisma.Decimal(Number(row['Total Exp(Rs. in Lakhs.)'] ?? row['Wages(Rs. In Lakhs)'] ?? 0) * 100000),
          status: Number(row['Total No. of Active Workers'] ?? 0) > 0 ? 'In Progress' : 'Under Review',
          blockchainStatus: 'Pending',
          blockchainHash: null,
          integrityStatus: 'Review Required',
        },
      });

      await prisma.blockchainRecord.create({
        data: {
          projectId: project.id,
          txHash: `seed-${project.code}`,
          action: 'IMPORT',
          amount: project.amount,
          payload: row as unknown as Prisma.InputJsonValue,
        },
      });
    }

    const projects = await prisma.project.findMany();
    for (const project of projects) {
      await prisma.integrityAudit.create({
        data: {
          projectId: project.id,
          databaseAmount: project.amount,
          blockchainAmount: project.amount,
          difference: new Prisma.Decimal(0),
          status: 'Verified',
          notes: { seeded: true },
        },
      });
    }
    console.log(`  ✅ Seeded ${projects.length} NREGA legacy projects`);
  } catch (err) {
    console.error('Error seeding legacy projects:', err);
  }
}

async function main() {
  await seedUsers();
  await seedTenders();
  await seedLegacyProjects();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
