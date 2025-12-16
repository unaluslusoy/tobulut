import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB...');
  try {
    const users = await prisma.user.findMany({
        include: { tenant: true }
    });
    console.log(`Found ${users.length} users.`);
    users.forEach(u => {
        console.log(`User: ${u.email} (ID: ${u.id})`);
        console.log(`  - Name: ${u.name}`);
        console.log(`  - Tenant: ${u.tenant?.name} (${u.tenant?.status})`);
        console.log(`  - 2FA Enabled: ${u.isTwoFactorEnabled}`);
        console.log(`  - 2FA Method: ${u.twoFactorMethod}`);
        console.log('-----------------------------------');
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
