const prisma = require('../prisma');
const { Prisma } = require('@prisma/client');
const botService = require('./bot.service');
const { logAction } = require('./audit.service');
const stockService = require('./stock.service');

class SaleService {
  /**
   * Generates a unique receipt number in a thread-safe way (to be used within a transaction)
   * Format: S-00001
   */
  async generateReceiptNo(tx, businessId) {
    // Use timestamp + random suffix for guaranteed uniqueness under concurrency
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const candidate = `S-${timestamp}-${random}`;
    
    // Verify it doesn't already exist for THIS business
    const existing = await tx.sale.findFirst({ where: { receiptNo: candidate, businessId } });
    if (existing) {
      // Fallback: use last id + 1
      const lastSale = await tx.sale.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true }
      });
      return `S-${String((lastSale?.id || 0) + 1).padStart(5, '0')}-${random}`;
    }
    return candidate;
  }

  async createSale(data, userId, businessId) {
    const {
      items, customerId, warehouseId,
      discount = 0, discountType = 'percent',
      paymentMethod = 'cash',
      cashAmount = 0, cardAmount = 0, bankAmount = 0, debtAmount = 0,
      note
    } = data;

    if (!Array.isArray(items) || items.length === 0) {
      throw Object.assign(new Error('Sotuv uchun mahsulotlar tanlanmagan'), { statusCode: 400 });
    }

    for (const item of items) {
      if (!item.productId || isNaN(item.quantity) || item.quantity <= 0) {
        throw Object.assign(new Error('Mahsulot miqdori noto\'g\'ri kiritilgan'), { statusCode: 400 });
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Validate products and stocks with Row-Level Locking (FOR UPDATE)
      // Sorting IDs prevents deadlocks in high-concurrency environments
      const sortedProductIds = [...new Set(items.map(i => i.productId))].sort((a, b) => a - b);

      // PostgreSQL ANY() sintaksisi — Prisma.sql bilan to'g'ri ishlatiladi
      // tx.join() Prisma'da mavjud emas — bu kritik xato edi
      await tx.$queryRaw(Prisma.sql`
        SELECT id FROM "Product" 
        WHERE id = ANY(${sortedProductIds}::int[]) AND "businessId" = ${businessId} 
        FOR UPDATE
      `);

      await tx.$queryRaw(Prisma.sql`
        SELECT id FROM "ProductStock" 
        WHERE "productId" = ANY(${sortedProductIds}::int[]) AND "warehouseId" = ${parseInt(warehouseId)} 
        FOR UPDATE
      `);

      const products = await tx.product.findMany({ where: { id: { in: sortedProductIds }, businessId } });
      const stocks = await tx.productStock.findMany({
        where: { warehouseId: parseInt(warehouseId), productId: { in: sortedProductIds } }
      });

      for (const item of items) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) throw Object.assign(new Error(`Mahsulot (ID:${item.productId}) topilmadi`), { statusCode: 404 });
        if (!prod.isActive) throw Object.assign(new Error(`${prod.name} nofaol`), { statusCode: 400 });

        const stock = stocks.find(s => s.productId === item.productId);
        const currentQty = stock?.quantity || 0;
        if (currentQty < item.quantity) {
          throw Object.assign(new Error(`${prod.name}dan tanlangan omborda yetarli emas. Mavjud: ${currentQty}`), { statusCode: 400 });
        }
      }

      // 1b. Qarz validatsiyasi: mijoz tanlanmasa qarzga sotib bo'lmaydi
      // Bu backend himoyasi — frontend allaqachon bloklaydi
      const hasDebt = paymentMethod === 'debt' ||
        (paymentMethod === 'mixed' && parseFloat(debtAmount) > 0);
      if (hasDebt && !customerId) {
        throw Object.assign(
          new Error("Qarzga sotish uchun mijoz tanlash majburiy!"),
          { statusCode: 400 }
        );
      }

      // 2. Calculate totals (using 2 decimal places precision)
      let subtotal = 0;
      const saleItemsData = items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const unitPrice = item.unitPrice || prod.sellPrice;
        const itemTotal = parseFloat((unitPrice * item.quantity).toFixed(2));
        subtotal += itemTotal;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          total: itemTotal,
          costPrice: prod.costPrice
        };
      });

      subtotal = parseFloat(subtotal.toFixed(2));
      let discountAmt = 0;
      if (discountType === 'percent') {
        const rate = Math.min(100, Math.max(0, parseFloat(discount) || 0));
        discountAmt = parseFloat((subtotal * rate / 100).toFixed(2));
      } else {
        discountAmt = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
      }

      const total = parseFloat((subtotal - discountAmt).toFixed(2));

      // Mixed payment validation
      if (paymentMethod === 'mixed') {
        const totalPaid = parseFloat((cashAmount + cardAmount + bankAmount + debtAmount).toFixed(2));
        if (Math.abs(totalPaid - total) > 0.01) {
          throw Object.assign(new Error(`To'lovlar yig'indisi (${totalPaid}) umumiy summaga (${total}) mos kelmadi`), { statusCode: 400 });
        }
      }

      // 3. Generate Receipt Number
      const receiptNo = await this.generateReceiptNo(tx, businessId);

      // 4. Save Sale
      const sale = await tx.sale.create({
        data: {
          receiptNo,
          businessId,
          cashierId: userId,
          customerId: customerId ? parseInt(customerId) : null,
          subtotal,
          discount: discountType === 'percent' ? parseFloat(discount) : 0,
          discountAmt,
          total,
          cashAmount: paymentMethod === 'cash' ? total : parseFloat(cashAmount) || 0,
          cardAmount: paymentMethod === 'card' ? total : parseFloat(cardAmount) || 0,
          bankAmount: paymentMethod === 'bank' ? total : parseFloat(bankAmount) || 0,
          debtAmount: paymentMethod === 'debt' ? total : parseFloat(debtAmount) || 0,
          paymentMethod,
          warehouseId: parseInt(warehouseId),
          items: { create: saleItemsData },
        },
        include: { items: true, customer: { select: { id: true, name: true } } },
      });

      // 5. Update Stocks and Create Transactions
      // businessId qo'shildi — adjustStock() SaaS tekshiruvi uchun zarur
      for (const item of items) {
        await stockService.adjustStock({
          productId: item.productId,
          warehouseId: parseInt(warehouseId),
          businessId,              // ← Kritik: SaaS izolyatsiyasi uchun shart
          quantity: -item.quantity,
          type: 'OUT',
          reason: `Sotuv #${receiptNo}`,
          userId
        }, tx);
      }

      // 6. Create Debt if needed
      const finalDebtAmount = paymentMethod === 'debt' ? total : debtAmount;
      if (finalDebtAmount > 0 && customerId) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await tx.debt.create({
          data: { type: 'customer', businessId, customerId: parseInt(customerId), saleId: sale.id, amount: finalDebtAmount, dueDate, status: 'pending' },
        });
      }

      // 7. Audit Log (sync in tx for consistency)
      // priceEdits: sotuvchi narxni o'zgartirgan mahsulotlar — egaga ko'rinadi
      const priceEdits = saleItemsData
        .filter(si => {
          const prod = products.find(p => p.id === si.productId);
          return prod && Math.abs(si.unitPrice - prod.sellPrice) > 0.01;
        })
        .map(si => {
          const prod = products.find(p => p.id === si.productId);
          return {
            productId:     si.productId,
            productName:   prod?.name,
            originalPrice: prod?.sellPrice,
            soldPrice:     si.unitPrice,
            qty:           si.quantity,
          };
        });

      await tx.auditLog.create({
        data: {
          userId,
          businessId,
          action: 'CREATE_SALE',
          entityType: 'Sale',
          entityId: sale.id,
          newData: {
            receiptNo:    sale.receiptNo,
            total:        sale.total,
            paymentMethod: sale.paymentMethod,
            itemsCount:   saleItemsData.length,
            // Narx o'zgartirilgan mahsulotlar (bo'sh bo'lsa — narx o'zgartirilmagan)
            priceEdits:   priceEdits.length > 0 ? priceEdits : undefined,
          }
        }
      });

      return sale;
    }).then(async (sale) => {
      // Async: Telegram notifications
      botService.sendClientSaleNotification(sale.id).catch(err => console.error('Client notification error:', err));
      botService.sendAdminSaleNotification(sale.id).catch(err => console.error('Admin notification error:', err));
      return sale;
    });
  }

  async cancelSale(id, userId, businessId, note = "Sotuv bekor qilindi") {
    const sale = await prisma.sale.findFirst({
      where: { id, businessId },
      include: { items: true }
    });

    if (!sale) throw Object.assign(new Error('Sotuv topilmadi'), { statusCode: 404 });
    if (sale.status === 'cancelled') throw Object.assign(new Error('Bu sotuv allaqachon bekor qilingan'), { statusCode: 400 });

    return await prisma.$transaction(async (tx) => {
      // 1. Update Sale status
      const updatedSale = await tx.sale.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      // 2. Restore stocks
      for (const item of sale.items) {
        const warehouseId = sale.warehouseId;
        if (!warehouseId) continue;

        await stockService.adjustStock({
          productId: item.productId,
          warehouseId,
          businessId,              // ← Kritik: SaaS izolyatsiyasi uchun shart
          quantity: item.quantity,
          type: 'IN',
          reason: `Bekor qilingan sotuv #${sale.receiptNo}`,
          userId
        }, tx);
      }

      // 3. Cancel related debt
      await tx.debt.updateMany({
        where: { saleId: id },
        data: { status: 'cancelled', note: `Sotuv bekor qilingani sababli yopildi. ${note}` }
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          businessId,
          action: 'CANCEL_SALE',
          entityType: 'Sale',
          entityId: id,
          oldData: { 
            receiptNo: sale.receiptNo, 
            total: sale.total, 
            customerId: sale.customerId,
            paymentMethod: sale.paymentMethod 
          },
          newData: { status: 'cancelled' },
          note
        }
      });

      return updatedSale;
    });
  }
}

module.exports = new SaleService();
