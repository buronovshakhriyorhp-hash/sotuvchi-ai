const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  const warehouseCount = await prisma.warehouse.count();
  
  console.log({ productCount, categoryCount, warehouseCount });
  
  if (productCount > 0) {
    const lastProduct = await prisma.product.findFirst({ orderBy: { id: 'desc' } });
    console.log('Last product:', lastProduct);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
