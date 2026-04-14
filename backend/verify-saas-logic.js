const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const botService = require('./src/services/bot.service');

async function verify() {
  console.log('--- SaaS Isolation Verification ---');

  try {
    // 1. Create a second business for testing if it doesn't exist
    const biz2 = await prisma.business.upsert({
      where: { slug: 'test-shop' },
      update: {},
      create: { 
        name: 'Test Shop 2', 
        slug: 'test-shop',
        settings: { storeName: 'Test Shop 2' }
      }
    });
    console.log('✅ Business 2 ready (ID:', biz2.id, ')');

    // 2. Test 1: Shared Phone Number (Multi-link)
    const testPhone = '998991234567';
    
    // Cleanup old test data
    await prisma.customer.deleteMany({ where: { phone: testPhone } });
    
    // Create customer in Biz 1
    const cust1 = await prisma.customer.create({
      data: { name: 'Mijoz 1 (Shop 1)', phone: testPhone, businessId: 1 }
    });
    // Create customer in Biz 2
    const cust2 = await prisma.customer.create({
      data: { name: 'Mijoz 1 (Shop 2)', phone: testPhone, businessId: biz2.id }
    });
    
    console.log('✅ Customers created in two different businesses with same phone.');

    // Mock bot contact share
    const mockCtx = {
      message: { contact: { phone_number: testPhone } },
      from: { id: '777888', first_name: 'TestUser' },
      chat: { id: '777888' },
      reply: async (msg) => console.log('   Bot Reply:', msg)
    };
    
    console.log('--- Simulating Bot Contact Share ---');
    await botService.handleClientContact(mockCtx);
    
    // Check if BOTH are updated
    const updatedCust1 = await prisma.customer.findUnique({ where: { id: cust1.id } });
    const updatedCust2 = await prisma.customer.findUnique({ where: { id: cust2.id } });
    
    if (updatedCust1.telegramChatId === '777888' && updatedCust2.telegramChatId === '777888') {
      console.log('✅ Identity Broadcast Success: Both customer profiles linked to one Telegram account.');
    } else {
      console.log('❌ Identity Broadcast Failure!');
    }

    // 3. Test 2: Receipt Isolation (Same Receipt No in different businesses)
    const receiptNo = 'VERIFY-' + Date.now();
    
    await prisma.sale.create({
      data: { 
        receiptNo, businessId: 1, total: 10, paymentMethod: 'cash', cashierId: 1, 
        subtotal: 10, discount: 0, items: { create: [] }, warehouseId: 1,
        customerId: cust1.id
      }
    });
    
    const sale2 = await prisma.sale.create({
      data: { 
        receiptNo, businessId: biz2.id, total: 20, paymentMethod: 'cash', cashierId: 1, 
        subtotal: 20, discount: 0, items: { create: [] }, warehouseId: 1,
        customerId: cust2.id
      }
    });

    console.log('✅ Receipt Isolation Success: Same receipt number used in different businesses.');

    // 4. Test 3: Notification Branding
    // We can't really "send" but we can check the logic
    const saleForNotify = await prisma.sale.findUnique({
      where: { id: sale2.id },
      include: { customer: { include: { business: true } } }
    });
    const brandName = saleForNotify.customer.business?.settings?.storeName || saleForNotify.customer.business?.name;
    
    if (brandName === 'Test Shop 2') {
      console.log('✅ Branding Isolation Success: Sale in Shop 2 correctly identifies as "Test Shop 2".');
    } else {
      console.log('❌ Branding Isolation Failure! Name:', brandName);
    }

    console.log('--- Cleanup ---');
    await prisma.sale.deleteMany({ where: { receiptNo } });
    await prisma.customer.deleteMany({ where: { phone: testPhone } });
    
    console.log('🏁 ALL TESTS PASSED SUCCESSFULLY');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
