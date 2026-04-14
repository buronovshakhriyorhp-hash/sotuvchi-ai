const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Migratsiya boshlandi...');

  try {
    // 1. "Nexus Asosiy" biznesini yaratish
    const business = await prisma.business.upsert({
      where: { slug: 'nexus-asosiy' },
      update: {},
      create: {
        name: 'Nexus Asosiy',
        slug: 'nexus-asosiy',
        settings: {
          storeName: 'Nexus Shop',
          reportTime: '21:00',
          allowReg: 'true'
        }
      }
    });

    const bId = business.id;
    console.log(`✅ Biznes yaratildi/topildi: ID=${bId}`);

    // 2. Barcha mavjud ma'lumotlarni ushbu biznesga bog'lash
    console.log('🔄 Ma\'lumotlarni bog\'lash...');

    await prisma.user.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.product.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.category.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.customer.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.warehouse.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.sale.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.debt.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.expense.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.supplier.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.order.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.telegramUser.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.auditLog.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.production.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.recipe.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.payment.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.warehouseTx.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.attribute.updateMany({ where: { businessId: null }, data: { businessId: bId } });
    await prisma.attributeValue.updateMany({ where: { businessId: null }, data: { businessId: bId } });

    console.log('🎉 Migratsiya muvaffaqiyatli yakunlandi!');
  } catch (error) {
    console.error('❌ Migratsiya xatosi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
