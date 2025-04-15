import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

const prisma = new PrismaClient();

async function seedVouchers() {
  try {
    // Read the CSV file
    const csvFilePath = path.join(__dirname, '../../data/vouchers.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

    // Parse CSV content
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Insert records into database
    for (const record of records) {
      await prisma.code.create({
        data: {
          value: record.code,
          used: false,
        },
      });
    }

    console.log('Successfully seeded voucher codes');
  } catch (error) {
    console.error('Error seeding voucher codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedVouchers();
