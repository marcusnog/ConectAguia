import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_MANAGER_EMAIL;
  const password = process.env.SEED_MANAGER_PASSWORD;
  const name = process.env.SEED_MANAGER_NAME;

  if (!email || !password || !name) {
    console.error(
      "Erro: SEED_MANAGER_EMAIL, SEED_MANAGER_PASSWORD e SEED_MANAGER_NAME são obrigatórios no .env"
    );
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  const manager = await prisma.manager.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: hash, name },
  });

  console.log("Gestor criado:", manager.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
