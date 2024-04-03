import { PrismaClient } from '@prisma/client';
import codes from '../codes.js';

const prisma = new PrismaClient();

async function main() {
    for (const code of codes) {
        await prisma.code.create({
            data: {
                value: code,
            },
        });
    }
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
