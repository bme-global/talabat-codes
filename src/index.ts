import express, { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import sendEmail from './sendEmail';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';

const app: Express = express();
const prisma = new PrismaClient();
const port = 3000;
const apiKey = process.env.API_KEY;
const isServiceEnabled = process.env.SERVICE_ENABLED === 'true';

app.use(express.static('public'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/uploads')) {
    return next();
  }
  const providedApiKey = req.headers['api-key'];
  if (!providedApiKey || providedApiKey !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

function logError(message: string) {
  fs.appendFile(
    path.join(__dirname, '../logs/error.log'),
    `${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} - ${message}\n`,
    (err) => {
      if (err) {
        console.error('Failed to write to error log file:', err);
      }
    }
  );
}

function logInfo(message: string) {
  fs.appendFile(
    path.join(__dirname, '../logs/info.log'),
    `${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} - ${message}\n`,
    (err) => {
      if (err) {
        console.error('Failed to write to info log file:', err);
      }
    }
  );
}

app.use(async (req: Request, res: Response, next) => {
  try {
    await prisma.$connect();
    next();
  } catch (error) {
    logError(`Database connection error`);
    res.status(500).json({ error: 'Database connection error' });
  }
});

async function checkExistingTicket(ticketNumber: string): Promise<boolean> {
  const existingTicket = await prisma.code.findUnique({
    where: { ticket: ticketNumber },
  });
  return !!existingTicket;
}

async function getFirstUnusedCode() {
  const code = await prisma.code.findFirst({
    where: { used: false },
    orderBy: { id: 'asc' },
  });

  if (code) {
    return code;
  }
}

async function sendVoucherEmail(email: string, ticketNumber: string, code: string) {
  try {
    const response = await sendEmail(email, code);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(`Failed to send email [#${ticketNumber}]: ${errorMessage}`);
    return null;
  }
}

async function updateCode(codeId: number, ticketNumber: string, email: string) {
  return await prisma.code.update({
    where: { id: codeId },
    data: {
      used: true,
      ticket: ticketNumber,
      email,
      usedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    },
  });
}

app.put('/code', async (req, res) => {
  if (!isServiceEnabled) {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

  const { ticketNumber, email } = req.body;

  if (!ticketNumber || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (await checkExistingTicket(ticketNumber)) {
    return res.status(409).json({ error: 'Ticket number already exists' });
  }

  const code = await getFirstUnusedCode();

  if (!code) {
    return res.status(404).json({ error: 'No unused codes found' });
  }

  const emailResponse = await sendVoucherEmail(email, ticketNumber, code.value);

  if (!emailResponse) {
    return res.status(500).json({ error: 'Failed to send email. Please check logs for details.' });
  }

  const updatedCode = await updateCode(code.id, ticketNumber, email);

  if (updatedCode) {
    logInfo(`Voucher id '${code.id}' sent to '${email}' for ticket '#${ticketNumber}'`);
    return res.json({ 'Voucher Code': updatedCode });
  } else {
    return res.status(500).json({ error: 'Failed to update code in database' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
