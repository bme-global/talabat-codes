import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

const prisma = new PrismaClient();

interface VoucherRecord {
  code: string;
  [key: string]: any; // For any additional fields
}

async function seedVouchers() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const csvFilePath = args[0] || path.join(__dirname, '../../data/vouchers.csv'); // Default to data/vouchers.csv if not provided

    // Read the CSV file
    const fullPath = path.resolve(csvFilePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`Error: CSV file not found at ${fullPath}`);
      console.log('Default path is ./data/vouchers.csv');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(fullPath, 'utf-8');

    // Parse CSV content
    const records: VoucherRecord[] = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    if (records.length === 0) {
      console.error('Error: No voucher records found in the CSV file.');
      process.exit(1);
    }

    // Verify records have 'code' field
    if (!records.every((record) => 'code' in record)) {
      console.error('Error: CSV file must contain a "code" column.');
      process.exit(1);
    }

    console.log(`Using CSV file: ${fullPath}`);
    console.log(`Found ${records.length} voucher codes in the CSV file.`);

    // Insert records into database
    let inserted = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        await prisma.code.create({
          data: {
            value: record.code,
            used: false,
          },
        });
        inserted++;
      } catch (error) {
        // Likely a duplicate code
        skipped++;
      }
    }

    console.log('Voucher codes seeding completed!');
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped} (likely duplicates)`);
  } catch (error) {
    console.error('Error seeding voucher codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedVouchers();
