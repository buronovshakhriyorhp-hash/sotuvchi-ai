const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ma\'lumotlar bazasi to\'ldirilmoqda...\n');

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Kiyim' },      update: {}, create: { name: 'Kiyim' } }),
    prisma.category.upsert({ where: { name: 'Poyabzal' },   update: {}, create: { name: 'Poyabzal' } }),
    prisma.category.upsert({ where: { name: 'Aksessuar' },  update: {}, create: { name: 'Aksessuar' } }),
    prisma.category.upsert({ where: { name: 'Kimyo' },      update: {}, create: { name: 'Kimyo' } }),
    prisma.category.upsert({ where: { name: 'Oziq-ovqat' }, update: {}, create: { name: 'Oziq-ovqat' } }),
  ]);
  console.log(`✅ ${categories.length} ta kategoriya yaratildi`);

  // Admin user
  const adminHash = await bcrypt.hash('@gumsmass645', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '+998941009122' },
    update: {},
    create: { name: 'Admin', phone: '+998941009122', passwordHash: adminHash, role: 'ADMIN' },
  });
  console.log(`✅ Admin yaratildi: ${admin.phone}`);
 
   // Warehouses
   const mainWarehouse = await prisma.warehouse.upsert({
     where: { name: 'Asosiy ombor' },
     update: {},
     create: { name: 'Asosiy ombor', address: 'Toshkent sh.' },
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
  const cashierHash = await bcrypt.hash('kassir123', 10);
  await prisma.user.upsert({
    where: { phone: '+998930001122' },
    update: {},
    create: { name: 'Malika Qodirov (Kassir)', phone: '+998930001122', passwordHash: cashierHash, role: 'CASHIER' },
  });

  // Products
  const productData = [
    { sku: 'TS-001', name: 'T-Shirt Cotton Basic',   categoryId: categories[0].id, costPrice: 80000,  sellPrice: 159900, stock: 120, minStock: 20 },
    { sku: 'JN-002', name: 'Denim Jeans Blue',        categoryId: categories[0].id, costPrice: 250000, sellPrice: 450000, stock: 45,  minStock: 10 },
    { sku: 'SH-003', name: 'Running Sneakers Pro',    categoryId: categories[1].id, costPrice: 500000, sellPrice: 899900, stock: 12,  minStock: 5  },
    { sku: 'AC-004', name: 'Leather Wallet Slim',     categoryId: categories[2].id, costPrice: 120000, sellPrice: 255000, stock: 350, minStock: 50 },
    { sku: 'AC-005', name: 'Classic Sunglasses',      categoryId: categories[2].id, costPrice: 60000,  sellPrice: 120000, stock: 15,  minStock: 20 },
    { sku: 'TS-006', name: 'Polo Shirt Classic',      categoryId: categories[0].id, costPrice: 90000,  sellPrice: 189900, stock: 88,  minStock: 15 },
    { sku: 'AC-007', name: 'Leather Belt Premium',    categoryId: categories[2].id, costPrice: 45000,  sellPrice: 95000,  stock: 200, minStock: 30 },
    { sku: 'SH-008', name: 'Casual Loafers Brown',   categoryId: categories[1].id, costPrice: 180000, sellPrice: 350000, stock: 30,  minStock: 10 },
    { sku: 'KY-009', name: 'Shampoo Premium 400ml',  categoryId: categories[3].id, costPrice: 15000,  sellPrice: 32000,  stock: 4,   minStock: 10 },
    { sku: 'TS-010', name: 'Sports Hoodie Grey',      categoryId: categories[0].id, costPrice: 130000, sellPrice: 249900, stock: 55,  minStock: 10 },
  ];

  for (const p of productData) {
    const createdProduct = await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p });
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
    prisma.customer.upsert({ where: { id: 1 }, update: {}, create: { name: 'Aliyev Vali',    phone: '+998901234567', type: 'individual', region: 'Toshkent'  } }),
    prisma.customer.upsert({ where: { id: 2 }, update: {}, create: { name: 'Qurilish MChJ',  phone: '+998719876543', type: 'company',     region: 'Toshkent'  } }),
    prisma.customer.upsert({ where: { id: 3 }, update: {}, create: { name: 'Zarina R.',       phone: '+998944561122', type: 'individual', region: 'Samarqand' } }),
    prisma.customer.upsert({ where: { id: 4 }, update: {}, create: { name: 'Olimov D.',       phone: '+998933210011', type: 'individual', region: "Farg'ona"  } }),
    prisma.customer.upsert({ where: { id: 5 }, update: {}, create: { name: 'Mega Store LLC', phone: '+998711112233', type: 'company',     region: 'Toshkent'  } }),
  ]);
  console.log(`✅ ${customers.length} ta mijoz yaratildi`);

  // Suppliers
  await prisma.supplier.upsert({ where: { id: 1 }, update: {}, create: { name: 'Textile Pro LLC',     phone: '+998900001122', category: 'Matolar',  region: 'Toshkent sh.' } });
  await prisma.supplier.upsert({ where: { id: 2 }, update: {}, create: { name: "Mega Bo'yoq",         phone: '+998931112233', category: 'Kimyo',    region: "Farg'ona vil." } });
  await prisma.supplier.upsert({ where: { id: 3 }, update: {}, create: { name: 'Global Charm Export', phone: '+998999998877', category: 'Xomashyo', region: 'Andijon vil.' } });
  console.log('✅ 3 ta yetkazuvchi yaratildi');

  // Orders
  const orders = [
    { orderNo: 'ORD-001', customerName: 'Aliyev Vali',    items: JSON.stringify([{ name: 'T-Shirt × 3' }]), amount: 479700,  status: 'new' },
    { orderNo: 'ORD-002', customerName: 'Zarina R.',       items: JSON.stringify([{ name: 'Denim Jeans × 1' }]), amount: 450000, status: 'ready' },
    { orderNo: 'ORD-003', customerName: 'Qurilish MChJ', items: JSON.stringify([{ name: 'Leather Wallet × 20' }]), amount: 5100000, status: 'delivered' },
  ];
  for (const o of orders) {
    await prisma.order.upsert({ where: { orderNo: o.orderNo }, update: {}, create: { ...o, dueDate: new Date(Date.now() + 3*24*60*60*1000) } });
  }
  console.log('✅ 3 ta buyurtma yaratildi');

  // Sample debts
  await prisma.debt.upsert({ where: { id: 1 }, update: {}, create: { type: 'customer', customerId: 2, amount: 450000, dueDate: new Date('2026-04-10'), status: 'overdue', note: 'Maxsulot qoldig\'i uchun' } });
  await prisma.debt.upsert({ where: { id: 2 }, update: {}, create: { type: 'supplier', supplierId: 1, amount: 4500000, dueDate: new Date('2026-04-08'), status: 'overdue', note: 'Xomashyo uchun' } });
  console.log('✅ Demo qarzlar yaratildi\n');

  console.log('🎉 Seed muvaffaqiyatli tugadi!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Login: +998941009122');
  console.log('🔑 Parol: @gumsmass645');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error).finally(() => prisma.$disconnect());
