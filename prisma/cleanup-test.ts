import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.appointmentExtra.deleteMany({
      where: { appointment: { client: { email: { in: ["test@example.com", "smoke@example.com", "second@example.com", "smoke@example.com", "cancel@example.com", "resched@example.com", "block@example.com", "blockholder@example.com"] } } } },
    }),
  ]);
  await prisma.appointment.deleteMany({
    where: { client: { email: { in: ["test@example.com", "smoke@example.com", "second@example.com", "smoke@example.com", "cancel@example.com", "resched@example.com", "block@example.com", "blockholder@example.com"] } } },
  });
  await prisma.client.deleteMany({
    where: { email: { in: ["test@example.com", "smoke@example.com", "second@example.com", "smoke@example.com", "cancel@example.com", "resched@example.com", "block@example.com", "blockholder@example.com"] } },
  });
  console.log("Cleaned test data");
}

main().finally(async () => {
  await prisma.$disconnect();
});


