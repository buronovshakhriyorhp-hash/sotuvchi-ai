const prisma = require('../prisma');

/**
 * Centralized service for managing product stocks across warehouses.
 * Ensures data consistency and audit trail for all stock movements.
 */
class StockService {
  /**
   * Adjusts stock for a specific product in a specific warehouse.
   * Updates both warehouse-specific stock and global product stock.
   * 
   * @param {Object} params
   * @param {number} params.productId Product ID
   * @param {number} params.warehouseId Warehouse ID
   * @param {number} params.quantity Quantity to change (positive for IN, negative for OUT)
   * @param {string} params.type Transaction type ('IN' or 'OUT')
   * @param {string} params.reason Reason for adjustment
   * @param {number} params.userId User ID performing the action
   * @param {number} params.businessId Business ID for isolation
   * @param {Object} [tx] Optional prisma transaction client
   */
  async adjustStock({ productId, warehouseId, businessId, quantity, type, reason, userId }, tx = prisma) {
    const qty = parseFloat(quantity);
    if (isNaN(qty)) throw new Error('Yaroqsiz miqdor');

    // 0. Verify ownership (SaaS Protection)
    const product = await tx.product.findFirst({ where: { id: parseInt(productId), businessId } });
    if (!product) throw new Error('Mahsulot topilmadi yoki sizga tegishli emas');
    
    const warehouse = await tx.warehouse.findFirst({ where: { id: parseInt(warehouseId), businessId } });
    if (!warehouse) throw new Error('Ombor topilmadi yoki sizga tegishli emas');

    // 1. Update or create warehouse-specific stock
    const stock = await tx.productStock.upsert({
      where: { 
        productId_warehouseId: { 
          productId: parseInt(productId), 
          warehouseId: parseInt(warehouseId) 
        } 
      },
      update: { quantity: { increment: qty } },
      create: { 
        productId: parseInt(productId), 
        warehouseId: parseInt(warehouseId), 
        quantity: qty 
      }
    });

    // 2. Update global product stock — Strictly scoped
    await tx.product.update({
      where: { id: parseInt(productId), businessId },
      data: { stock: { increment: qty } }
    });

    // 3. Create warehouse transaction record
    const warehouseTx = await tx.warehouseTx.create({
      data: {
        type: type || (qty >= 0 ? 'IN' : 'OUT'),
        productId: parseInt(productId),
        warehouseId: parseInt(warehouseId),
        quantity: Math.abs(qty),
        userId: parseInt(userId)
      }
    });

    return { stock, warehouseTx };
  }

  /**
   * Checks if sufficient stock exists for a product in a warehouse.
   */
  async checkAvailability(productId, warehouseId, requiredQty, businessId) {
    const stock = await prisma.productStock.findFirst({
      where: { 
        productId: parseInt(productId), 
        warehouseId: parseInt(warehouseId),
        product: { businessId }
      }
    });
    return (stock?.quantity || 0) >= parseFloat(requiredQty);
  }

  /**
   * Transfers stock between warehouses.
   */
  async transferStock({ productId, fromWarehouseId, toWarehouseId, businessId, quantity, reason, userId }) {
    const qty = parseFloat(quantity);
    if (qty <= 0) throw new Error('Miqdor musbat bo\'lishi kerak');

    return await prisma.$transaction(async (tx) => {
      // Check availability
      const available = await this.checkAvailability(productId, fromWarehouseId, qty, businessId);
      if (!available) throw new Error('Manba omborida yetarli qoldiq yo\'q');

      // 1. Deduct from source
      await this.adjustStock({
        productId,
        warehouseId: fromWarehouseId,
        businessId,
        quantity: -qty,
        type: 'OUT',
        reason: reason || `Omborlararo o'tkazma #${toWarehouseId} ga`,
        userId
      }, tx);

      // 2. Add to destination
      await this.adjustStock({
        productId,
        warehouseId: toWarehouseId,
        businessId,
        quantity: qty,
        type: 'IN',
        reason: reason || `Omborlararo o'tkazma #${fromWarehouseId} dan`,
        userId
      }, tx);

      return true;
    });
  }

  /**
   * Reconciles stock to a specific absolute quantity (Stock Audit).
   * Calculates the difference and logs as an ADJUSTMENT.
   *
   * FIX: Nested $transaction() olib tashlandi.
   * tx berilgan bo'lsa (tashqi tranzaksiya ichidan chaqirilsa) \u2014 bevosita tx ustida ishlaydi.
   * tx berilmasa \u2014 yangi $transaction qo'zg'atadi.
   * Prisma nested transactions'ni qo'llab-quvvatlamaydi!
   */
  async reconcileStock({ productId, warehouseId, businessId, realQuantity, userId }, tx = null) {
    const realQty = parseFloat(realQuantity);
    const pId = parseInt(productId);
    const wId = parseInt(warehouseId) || 1;
    const bId = parseInt(businessId);
    const uId = parseInt(userId);

    if (isNaN(realQty) || realQty < 0) throw new Error('Yaroqsiz miqdor');
    if (isNaN(pId) || isNaN(wId)) throw new Error('Mahsulot yoki ombor ID xato');

    // Asosiy logika \u2014 tranzaksiya clientiga bog'liq emas
    const run = async (stx) => {
      // 0. Verify ownership
      const product = await stx.product.findFirst({ where: { id: pId, businessId: bId } });
      if (!product) throw new Error('Mahsulot topilmadi');

      // 1. Get current stock
      const stockRec = await stx.productStock.findUnique({
        where: { productId_warehouseId: { productId: pId, warehouseId: wId } }
      });

      const currentQty = stockRec ? stockRec.quantity : 0;
      const diff = realQty - currentQty;

      if (diff === 0) return { message: "O'zgarish yo'q", diff: 0, newQuantity: realQty };

      // 2. Update to absolute realQty
      await stx.productStock.upsert({
        where: { productId_warehouseId: { productId: pId, warehouseId: wId } },
        update: { quantity: realQty },
        create: { productId: pId, warehouseId: wId, quantity: realQty }
      });

      // 3. Update global stock — Strictly scoped
      await stx.product.update({
        where: { id: pId, businessId: bId },
        data: { stock: { increment: diff } }
      });

      // 4. Log Tx
      await stx.warehouseTx.create({
        data: {
          type:        diff > 0 ? 'ADJUST_IN' : 'ADJUST_OUT',
          productId:   pId,
          warehouseId: wId,
          quantity:    Math.abs(diff),
          userId:      uId,
          businessId:  bId
        }
      });

      return { diff, newQuantity: realQty };
    };

    // Agar tashqi tx berilgan bo'lsa \u2014 nested transaction YARATMAYMIZ
    // Agar tx yo'q bo'lsa \u2014 mustaqil $transaction ochamiz
    return tx ? run(tx) : prisma.$transaction(run);
  }
}

module.exports = new StockService();
