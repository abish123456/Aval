import { prisma } from "../lib/db";

async function main() {
  const enqs = await prisma.enquiry.findMany({
    include: { messages: true }
  });
  console.log("Enquiries count:", enqs.length);
  console.log("Enquiries:", JSON.stringify(enqs, null, 2));
}

main().finally(() => prisma.$disconnect());
