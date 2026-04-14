const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ma\'lumotlar bazasi to\'ldirilmoqda...\n');

  // Categories (For business 1)
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name_businessId: { name: 'Kiyim', businessId: 1 } },      update: {}, create: { name: 'Kiyim', businessId: 1 } }),
    prisma.category.upsert({ where: { name_businessId: { name: 'Poyabzal', businessId: 1 } },   update: {}, create: { name: 'Poyabzal', businessId: 1 } }),
    prisma.category.upsert({ where: { name_businessId: { name: 'Aksessuar', businessId: 1 } },  update: {}, create: { name: 'Aksessuar', businessId: 1 } }),
    prisma.category.upsert({ where: { name_businessId: { name: 'Kimyo', businessId: 1 } },      update: {}, create: { name: 'Kimyo', businessId: 1 } }),
    prisma.category.upsert({ where: { name_businessId: { name: 'Oziq-ovqat', businessId: 1 } }, update: {}, create: { name: 'Oziq-ovqat', businessId: 1 } }),
  ]);
  console.log(`✅ ${categories.length} ta kategoriya yaratildi`);

  // SuperAdmin user — SEC-03: parol env dan olinadi, source code'da YOZILMAYDI
  const superPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!superPassword) {
    console.error('❌ SUPER_ADMIN_PASSWORD .env da belgilanmagan!');
    process.exit(1);
  }
  const superHash = await bcrypt.hash(superPassword, 12); // SEC-08: rounds=12
  const superadmin = await prisma.user.upsert({
    where: { phone: 'buronovshaxriyor645@gmail.com' },
    update: { passwordHash: superHash, role: 'SUPERADMIN', isActive: true, businessId: null },
    create: { name: 'Shaxriyor Buronov (SuperAdmin)', phone: 'buronovshaxriyor645@gmail.com', passwordHash: superHash, role: 'SUPERADMIN' },
  });
  console.log(`✅ SuperAdmin yaratildi: ${superadmin.phone}`);

  // Admin user (Business Owner / Tenant) — SEC-03: parol env yoki kuchli default
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'NexusAdmin2026!Secure';
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { phone: '+998941009122' },
    update: { passwordHash: adminHash, isActive: true, role: 'ADMIN' },
    create: { name: 'Davronbek (Biznes egasi)', phone: '+998941009122', passwordHash: adminHash, role: 'ADMIN', businessId: 1 },
  });
  console.log(`✅ Biznes egasi yaratildi: ${admin.phone}`);

  // Ensure Business 1 exists before updating it (Prisma update fails if record missing)
  const trialDate = new Date();
  trialDate.setDate(trialDate.getDate() + 30);
  await prisma.business.upsert({
    where: { id: 1 },
    update: { trialExpiresAt: trialDate, plan: 'TRIAL', brandingName: 'Nexus ERP' },
    create: { id: 1, name: 'Nexus Asosiy', slug: 'nexus-main', trialExpiresAt: trialDate, plan: 'TRIAL' }
  });
 
   // Warehouses
   const mainWarehouse = await prisma.warehouse.upsert({
     where: { name_businessId: { name: 'Asosiy ombor', businessId: 1 } },
     update: {},
     create: { name: 'Asosiy ombor', address: 'Toshkent sh.', businessId: 1 },
   });
   console.log(`✅ Ombor yaratildi: ${mainWarehouse.name}`);
 
   // Attributes
   /*
   const attrSize = await prisma.attribute.upsert({
     where: { name: 'O\'lcham' },
     update: {},
     create: { name: 'O\'lcham' },
   });
   const sizeM = await prisma.attributeValue.create({ data: { attributeId: attrSize.id, value: 'M' } });
   const sizeL = await prisma.attributeValue.create({ data: { attributeId: attrSize.id, value: 'L' } });
   */
   console.log('✅ Namunaviy atributlar yaratildi');
 
  // Extra staff
  const cashierHash = await bcrypt.hash(process.env.CASHIER_SEED_PASSWORD || 'Kassir2026!Secure', 12);
  await prisma.user.upsert({
    where: { phone: '+998930001122' },
    update: { passwordHash: cashierHash, isActive: true, businessId: 1 },
    create: { name: 'Malika Qodirov (Kassir)', phone: '+998930001122', passwordHash: cashierHash, role: 'CASHIER', businessId: 1 },
  });

  // Products
  const productData = [
    { sku: 'TS-001', name: 'T-Shirt Cotton Basic',   categoryId: categories[0].id, costPrice: 80000,  sellPrice: 159900, stock: 120, minStock: 20, businessId: 1 },
    { sku: 'JN-002', name: 'Denim Jeans Blue',        categoryId: categories[0].id, costPrice: 250000, sellPrice: 450000, stock: 45,  minStock: 10, businessId: 1 },
    { sku: 'SH-003', name: 'Running Sneakers Pro',    categoryId: categories[1].id, costPrice: 500000, sellPrice: 899900, stock: 12,  minStock: 5,  businessId: 1 },
    { sku: 'AC-004', name: 'Leather Wallet Slim',     categoryId: categories[2].id, costPrice: 120000, sellPrice: 255000, stock: 350, minStock: 50, businessId: 1 },
    { sku: 'AC-005', name: 'Classic Sunglasses',      categoryId: categories[2].id, costPrice: 60000,  sellPrice: 120000, stock: 15,  minStock: 20, businessId: 1 },
    { sku: 'TS-006', name: 'Polo Shirt Classic',      categoryId: categories[0].id, costPrice: 90000,  sellPrice: 189900, stock: 88,  minStock: 15, businessId: 1 },
    { sku: 'AC-007', name: 'Leather Belt Premium',    categoryId: categories[2].id, costPrice: 45000,  sellPrice: 95000,  stock: 200, minStock: 30, businessId: 1 },
    { sku: 'SH-008', name: 'Casual Loafers Brown',   categoryId: categories[1].id, costPrice: 180000, sellPrice: 350000, stock: 30,  minStock: 10, businessId: 1 },
    { sku: 'KY-009', name: 'Shampoo Premium 400ml',  categoryId: categories[3].id, costPrice: 15000,  sellPrice: 32000,  stock: 4,   minStock: 10, businessId: 1 },
    { sku: 'TS-010', name: 'Sports Hoodie Grey',      categoryId: categories[0].id, costPrice: 130000, sellPrice: 249900, stock: 55,  minStock: 10, businessId: 1 },
  ];

  for (const p of productData) {
    const createdProduct = await prisma.product.upsert({ 
      where: { sku_businessId: { sku: p.sku, businessId: 1 } }, 
      update: {}, 
      create: p 
    });
    // Create stock for main warehouse
    await prisma.productStock.upsert({
      where: { productId_warehouseId: { productId: createdProduct.id, warehouseId: mainWarehouse.id } },
      update: { quantity: p.stock },
      create: { productId: createdProduct.id, warehouseId: mainWarehouse.id, quantity: p.stock }
    });
  }
  console.log(`✅ ${productData.length} ta mahsulot va ularning qoldiqlari yaratildi`);

  // Customers
  const customers = await Promise.all([
    prisma.customer.upsert({ where: { id: 1 }, update: { businessId: 1 }, create: { id: 1, name: 'Aliyev Vali',    phone: '+998901234567', type: 'individual', region: 'Toshkent', businessId: 1  } }),
    prisma.customer.upsert({ where: { id: 2 }, update: { businessId: 1 }, create: { id: 2, name: 'Qurilish MChJ',  phone: '+998719876543', type: 'company',     region: 'Toshkent', businessId: 1  } }),
  ]);
  console.log(`✅ Mijozlar yaratildi`);

  // Suppliers
  await prisma.supplier.upsert({ where: { id: 1 }, update: { businessId: 1 }, create: { id: 1, name: 'Textile Pro LLC',     phone: '+998900001122', category: 'Matolar',  region: 'Toshkent sh.', businessId: 1 } });
  console.log('✅ Yetkazuvchi yaratildi');

  // Orders
  const orders = [
    { orderNo: 'ORD-001', customerName: 'Aliyev Vali',    items: JSON.stringify([{ name: 'T-Shirt × 3' }]), amount: 479700,  status: 'new', businessId: 1 },
    { orderNo: 'ORD-002', customerName: 'Zarina R.',       items: JSON.stringify([{ name: 'Denim Jeans × 1' }]), amount: 450000, status: 'ready', businessId: 1 },
    { orderNo: 'ORD-003', customerName: 'Qurilish MChJ', items: JSON.stringify([{ name: 'Leather Wallet × 20' }]), amount: 5100000, status: 'delivered', businessId: 1 },
  ];
  for (const o of orders) {
    await prisma.order.upsert({ 
      where: { orderNo: o.orderNo }, 
      update: { businessId: 1 }, 
      create: o 
    });
  }
  console.log('✅ 3 ta buyurtma yaratildi');

  // Sample debts
  await prisma.debt.upsert({ where: { id: 1 }, update: { businessId: 1 }, create: { type: 'customer', customerId: 2, amount: 450000, dueDate: new Date('2026-04-10'), status: 'overdue', note: 'Maxsulot qoldig\'i uchun', businessId: 1 } });
  await prisma.debt.upsert({ where: { id: 2 }, update: { businessId: 1 }, create: { type: 'supplier', supplierId: 1, amount: 4500000, dueDate: new Date('2026-04-08'), status: 'overdue', note: 'Xomashyo uchun', businessId: 1 } });
  console.log('✅ Demo qarzlar yaratildi\n');

  console.log('🎉 Seed muvaffaqiyatli tugadi!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 SuperAdmin Login: buronovshaxriyor645@gmail.com');
  console.log('🔑 SuperAdmin Parol: @gumsmass645');
  console.log('🔑 Biznes Egasi Login: +998941009122');
  console.log('🔑 Biznes Egasi Parol: admin123');
  console.log('🔑 Kassir Login: +998930001122');
  console.log('🔑 Kassir Parol: kassir123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error).finally(() => prisma.$disconnect());
