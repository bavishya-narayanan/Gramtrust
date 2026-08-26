import { config } from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNregaCsv } from '../src/utils/csv';
import bcrypt from 'bcryptjs';

config();

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, '../../datasets/NREGA.csv');

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

async function main() {
  await seedUsers();

  const csvContent = await readFile(csvPath, 'utf8');
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

