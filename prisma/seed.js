import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const codes = ['VT2gdyMP', 'IJscpIo2', '55tCjvBf', 'bciUdDVe', 'QxHT65jb'];

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
