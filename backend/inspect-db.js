const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const businesses = await prisma.business.findMany({ select: { id: true, name: true } });
  console.log('Businesses:', JSON.stringify(businesses, null, 2));

  const users = await prisma.user.findMany({ select: { id: true, name: true, phone: true, businessId: true, role: true } });
  console.log('Users:', JSON.stringify(users, null, 2));
  
  await prisma.$disconnect();
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
