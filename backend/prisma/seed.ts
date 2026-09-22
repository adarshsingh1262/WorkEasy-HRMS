import { PrismaClient } from "@prisma/client";
import { ALL_PERMISSIONS } from "../src/utils/permissions";
import { seedPermissions } from "../src/utils/seedPermissions";

const prisma = new PrismaClient();

async function main() {
  await seedPermissions();
  console.log(`Seeded ${ALL_PERMISSIONS.length} permissions.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
