import { config } from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

config();

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, '../datasets/NREGA.csv');

async function main() {
	const csvContent = await readFile(csvPath, 'utf8');
	const rows = parse(csvContent, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
	}) as Array<{
		projectId: string;
		projectName: string;
		district: string;
		state: string;
		financialYear: string;
		amount: string;
		status: string;
	}>;

	for (const row of rows) {
		await prisma.project.upsert({
			where: { code: row.projectId },
			create: {
				code: row.projectId,
				name: row.projectName,
				district: row.district,
				state: row.state,
				financialYear: row.financialYear,
				amount: new Prisma.Decimal(row.amount),
				status: row.status,
				blockchainStatus: 'Pending',
				blockchainHash: null,
				integrityStatus: 'Review Required',
			},
			update: {
				name: row.projectName,
				district: row.district,
				state: row.state,
				financialYear: row.financialYear,
				amount: new Prisma.Decimal(row.amount),
				status: row.status,
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
