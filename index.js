import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();

const port = 4000;

const apiKey = process.env.API_KEY;

// Middleware to check for API key
const checkApiKey = (req, res, next) => {
    const providedApiKey = req.headers['api-key'];
    if (!providedApiKey || providedApiKey !== apiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.use(checkApiKey);
app.use(express.json());

app.get('/code', (req, res) => {
    const prisma = new PrismaClient();
    prisma.code
        .findFirst({
            where: {
                used: false,
            },
            orderBy: {
                id: 'asc',
            },
        })
        .then((code) => {
            if (code) {
                res.json(code);
            } else {
                res.status(404).json({ error: 'No unused code found' });
            }
        })
        .catch((e) => {
            res.status(500).json({ error: 'Internal Server Error' });
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
});

app.put('/code', (req, res) => {
    const prisma = new PrismaClient();
    const { codeId, ticketNumber } = req.body;

    prisma.code
        .findUnique({
            where: {
                id: codeId,
            },
        })
        .then((code) => {
            if (code && !code.used) {
                return prisma.code.update({
                    where: {
                        id: codeId,
                    },
                    data: {
                        used: true,
                        ticket: ticketNumber,
                    },
                });
            } else {
                throw new Error('Code is already used or does not exist');
            }
        })
        .then((code) => {
            res.json(code);
            console.log(`Code ${code.value} used for ticket ${code.ticket}`);
        })
        .catch((e) => {
            res.status(500).json({ error: e.message });
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
