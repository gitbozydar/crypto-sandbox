import { prisma } from "./db";

const userCount = async () => {
  const users = await prisma.user.count();
  console.log("Connected, users available:", users);
};

userCount().finally(() => prisma.$disconnect);
