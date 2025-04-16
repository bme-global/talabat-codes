import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';
import sendEmail from '../sendEmail';
import { setTimeout } from 'timers/promises';

const prisma = new PrismaClient();

interface EmailRecord {
  email: string;
  ticketNumber?: string; // Optional field if ticket numbers are included in the CSV
}

// Custom progress bar function that won't overlap with other console output
function updateProgressBar(current: number, total: number) {
  const percent = Math.floor((current / total) * 100);
  const barLength = 40;
  const completeLength = Math.floor((current / total) * barLength);
  const completeChar = '█';
  const incompleteChar = '░';

  const bar = completeChar.repeat(completeLength) + incompleteChar.repeat(barLength - completeLength);
  const eta = Math.ceil((total - current) / 2); // Assuming 2 emails per second

  // Clear current line and print progress
  process.stdout.write(`\rProgress |${bar}| ${percent}% | ${current}/${total} emails | ETA: ${eta}s`);

  // If complete, add a newline
  if (current === total) {
    process.stdout.write('\n');
  }
}

async function sendCouponsToEmailList() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const csvFilePath = args[0] || './data/emails.csv'; // Default to data/emails.csv if not provided
    const emailsPerSecond = parseInt(args[1] || '2', 10); // Default: 2 emails per second

    // Read the CSV file
    const fullPath = path.resolve(csvFilePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`Error: CSV file not found at ${fullPath}`);
      console.log('Default path is ./data/emails.csv');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(fullPath, 'utf-8');

    // Parse CSV content
    const records: EmailRecord[] = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    if (records.length === 0) {
      console.error('Error: No email records found in the CSV file.');
      process.exit(1);
    }

    // Verify all records have email field
    if (!records.every((record) => 'email' in record)) {
      console.error('Error: CSV file must contain an "email" column.');
      process.exit(1);
    }

    console.log(`Using CSV file: ${fullPath}`);
    console.log(`Found ${records.length} email records in the CSV file.`);

    // Check if we have enough unused codes
    const unusedCodesCount = await prisma.code.count({
      where: {
        used: false,
      },
    });

    if (unusedCodesCount < records.length) {
      console.error(`Error: Not enough unused codes. Required: ${records.length}, Available: ${unusedCodesCount}`);
      process.exit(1);
    }

    console.log(`Found ${unusedCodesCount} unused codes in the database.`);
    console.log(`Rate limit: ${emailsPerSecond} emails per second.`);
    console.log(`Starting email sending process...`);

    // Process emails with rate limiting
    const delayBetweenEmails = Math.floor(1000 / emailsPerSecond);
    let processed = 0;
    let success = 0;
    let failed = 0;

    const logFilePath = path.join(__dirname, '../../logs/email-sending.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    // Initial progress bar
    updateProgressBar(0, records.length);

    for (const record of records) {
      try {
        // Get an unused code
        const code = await prisma.code.findFirst({
          where: {
            used: false,
          },
        });

        if (!code) {
          throw new Error('No unused codes available.');
        }

        // Send email
        const statusCode = await sendEmail(record.email, code.value);

        // Update code status
        await prisma.code.update({
          where: {
            id: code.id,
          },
          data: {
            used: true,
            email: record.email,
            ticket: record.ticketNumber || `batch-${new Date().toISOString()}`,
            usedAt: new Date().toISOString(),
          },
        });

        // Log success to file (NOT to console)
        logStream.write(
          `${new Date().toISOString()} - SUCCESS - Email sent to ${record.email} with code ${
            code.value
          } (Status: ${statusCode})\n`
        );
        success++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStream.write(
          `${new Date().toISOString()} - ERROR - Failed to send email to ${record.email}: ${errorMessage}\n`
        );
      }

      processed++;
      // Update progress bar with current progress
      updateProgressBar(processed, records.length);

      // Apply rate limiting
      if (processed < records.length) {
        await setTimeout(delayBetweenEmails);
      }
    }

    logStream.end();

    // Print the final summary
    console.log('\nEmail sending completed!');
    console.log(`Total processed: ${processed}`);
    console.log(`Successful: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Log file: ${logFilePath}`);
  } catch (error) {
    console.error('Error sending coupons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendCouponsToEmailList();
