import express, { Express, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import sendEmail from './sendEmail';
import { format } from 'date-fns';

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

app.use(express.json());

app.put('/code', async (req, res) => {
    const { ticketNumber, email } = req.body;

    try {
        const existingTicket = await prisma.code.findUnique({
            where: { ticket: ticketNumber },
        });

        if (existingTicket) {
            return res.status(409).json({ error: 'Ticket number already exists' });
        }

        const code = await prisma.code.findFirst({
            where: { used: false },
            orderBy: { id: 'asc' },
        });

        if (!code) {
            return res.status(404).json({ error: 'No unused code found' });
        }

        let updatedCode = await prisma.code.update({
            where: { id: code.id },
            data: {
                used: true,
                ticket: ticketNumber,
                email,
                usedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            },
        });

        console.log(`Code '${updatedCode.value}' used for ticket '${updatedCode.ticket}'`);

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
