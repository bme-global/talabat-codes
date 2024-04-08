import express, { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import sendEmail from './sendEmail';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { log } from 'console';

const app: Express = express();
const prisma = new PrismaClient();
const port = 3000;
const apiKey = process.env.API_KEY;

app.use((req: Request, res: Response, next) => {
    const providedApiKey = req.headers['api-key'];
    if (!providedApiKey || providedApiKey !== apiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

function logError(message: string) {
    fs.appendFile(
        path.join(__dirname, '../error.log'),
        `${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} - ${message}\n`,
        (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        }
    );
}

app.use(async (req: Request, res: Response, next) => {
    try {
        await prisma.$connect();
        next();
    } catch (error) {
        logError('Database connection error');
        res.status(500).json({ error: 'Database connection error' });
    }
});

app.use(express.json());

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

    let updatedCode = await updateCode(code.id, ticketNumber, email);

    try {
        try {
            const statusCode = await sendEmail(email, ticketNumber, updatedCode.value);
            updatedCode = await prisma.code.update({
                where: { id: updatedCode.id },
                data: { sent: true },
            });
            res.json(updatedCode);
            console.log(`Email sent to '${email}' with status ${statusCode}`);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Still return the updated code even if email fails
            res.status(500).json({ error: 'Email sending failed', details: (emailError as Error).message });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: (error as Error).message });
    } finally {
        await prisma.$disconnect();
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
