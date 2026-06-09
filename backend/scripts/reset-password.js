require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany();
  if (users.length === 0) {
    console.log("Nenhum usuário encontrado no banco de dados.");
  } else {
    const user = users[0];
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    console.log(`Senha do usuário ${user.email} (Nome: ${user.name}) alterada para: 123456`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
