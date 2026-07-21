import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
await prisma.notificationSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
await prisma.$disconnect();
