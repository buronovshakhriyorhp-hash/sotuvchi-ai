const prisma = require('../prisma');
const botService = require('./bot.service');
const { logAction } = require('./audit.service');

class SaleService {
  /**
   * Generates a unique receipt number in a thread-safe way (to be used within a transaction)
   * Format: S-00001
   */
  async generateReceiptNo(tx) {
    const lastSale = await tx.sale.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const nextId = (lastSale?.id || 0) + 1;
    return `S-${String(nextId).padStart(5, '0')}`;
  }

  async createSale(data, userId) {
    const {
      items, customerId, warehouseId,
      discount = 0, discountType = 'percent',
      paymentMethod = 'cash',
      cashAmount = 0, cardAmount = 0, bankAmount = 0, debtAmount = 0,
      note
    } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Validate products and stocks
      const productIds = items.map(i => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const stocks = await tx.productStock.findMany({
        where: { warehouseId: parseInt(warehouseId), productId: { in: productIds } }
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
      const receiptNo = await this.generateReceiptNo(tx);

      // 4. Save Sale
      const sale = await tx.sale.create({
        data: {
          receiptNo,
          cashierId: userId,
          customerId: customerId ? parseInt(customerId) : null,
          subtotal,
          discount: discountType === 'percent' ? parseFloat(discount) : 0,
          discountAmt,
          total,
          cashAmount: paymentMethod === 'cash' ? total : cashAmount,
          cardAmount: paymentMethod === 'card' ? total : cardAmount,
          bankAmount: paymentMethod === 'bank' ? total : bankAmount,
          debtAmount: paymentMethod === 'debt' ? total : debtAmount,
          paymentMethod,
          note,
          items: { create: saleItemsData },
        },
        include: { items: true, customer: true },
      });

      // 5. Update Stocks and Create Transactions
      for (const item of items) {
        await tx.productStock.update({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: parseInt(warehouseId) } },
          data: { quantity: { decrement: item.quantity } },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.warehouseTx.create({
          data: {
            type: 'OUT',
            productId: item.productId,
            warehouseId: parseInt(warehouseId),
            quantity: item.quantity,
            reason: `Sotuv #${receiptNo}`,
            userId: userId
          },
        });
      }

      // 6. Create Debt if needed
      const finalDebtAmount = paymentMethod === 'debt' ? total : debtAmount;
      if (finalDebtAmount > 0 && customerId) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await tx.debt.create({
          data: { type: 'customer', customerId: parseInt(customerId), saleId: sale.id, amount: finalDebtAmount, dueDate, status: 'pending' },
        });
      }

      // 7. Audit Log (sync in tx for consistency)
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_SALE',
          entityType: 'Sale',
          entityId: sale.id,
          newData: sale
        }
      });

      return sale;
    }).then(async (sale) => {
      // Async: Telegram notification
      botService.sendSaleNotification(sale.id).catch(err => console.error('Bot notification error:', err));
      return sale;
    });
  }

  async cancelSale(id, userId, note = "Sotuv bekor qilindi") {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!sale) throw Object.assign(new Error('Sotuv topilmadi'), { statusCode: 404 });
    if (sale.status === 'cancelled') throw Object.assign(new Error('Bu sotuv allaqachon bekor qilingan'), { statusCode: 400 });

    return await prisma.$transaction(async (tx) => {
      // 1. Update Sale status
      const updatedSale = await tx.sale.update({
        where: { id },
        data: { status: 'cancelled', note: sale.note ? `${sale.note} | Bekor qilindi: ${note}` : note }
      });

      // 2. Restore stocks
      for (const item of sale.items) {
        // Track warehouse from original transaction
        const lastTx = await tx.warehouseTx.findFirst({
          where: { productId: item.productId, reason: { contains: sale.receiptNo }, type: 'OUT' },
          orderBy: { createdAt: 'desc' }
        });

        const warehouseId = lastTx?.warehouseId || 1;

        await tx.productStock.update({
          where: { productId_warehouseId: { productId: item.productId, warehouseId } },
          data: { quantity: { increment: item.quantity } }
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        await tx.warehouseTx.create({
          data: {
            type: 'IN',
            productId: item.productId,
            warehouseId,
            quantity: item.quantity,
            reason: `Bekor qilingan sotuv #${sale.receiptNo}`,
            userId
          }
        });
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
          action: 'CANCEL_SALE',
          entityType: 'Sale',
          entityId: id,
          oldData: sale,
          newData: { status: 'cancelled' },
          note
        }
      });

      return updatedSale;
    });
  }
}

module.exports = new SaleService();
