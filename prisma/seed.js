const { PrismaClient } = require('@prisma/client');
const codes = require('./codes.js'); // Import the codes from the codes.js file in array format

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
