const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const establishments = await prisma.establishments.findMany({
      where: {
        name: {
          contains: 'teste',
          mode: 'insensitive'
        }
      },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(JSON.stringify(establishments, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
