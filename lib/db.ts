import "dotenv/config"; // skrypty (tsx) same nie wczytują .env — Next.js robi to automatycznie
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/src/generated/prisma/client";

// Jeden klient bazy dla całej aplikacji (Postgres na Neonie).
export const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});
