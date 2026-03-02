import { prisma } from "@/lib/prisma";

export async function getOrCreateUser(email: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email }
  });
}

export async function checkGenerationRateLimit(userId: string, perHour: number) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.generationLog.count({
    where: {
      userId,
      createdAt: { gte: since }
    }
  });

  return {
    allowed: count < perHour,
    used: count,
    limit: perHour
  };
}

