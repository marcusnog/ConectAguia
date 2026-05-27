import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("admin123", 12);

  const manager = await prisma.manager.upsert({
    where: { email: "gestor@conectaguia.com.br" },
    update: {},
    create: {
      email: "gestor@conectaguia.com.br",
      passwordHash: hash,
      name: "Gestor Principal",
    },
  });

  console.log("Gestor criado:", manager.email);
  console.log("Senha: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
