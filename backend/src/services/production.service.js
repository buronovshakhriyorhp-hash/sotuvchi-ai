const prisma = require('../prisma');
const stockService = require('./stock.service');

class ProductionService {
  /**
   * Create a new recipe for a finished product.
   */
  async createRecipe({ name, productId, items }, businessId) {
    return await prisma.recipe.create({
      data: {
        name,
        businessId,
        productId: parseInt(productId),
        items: {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            quantity: parseFloat(item.quantity)
          }))
        }
      },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } }
    });
  }

  /**
   * Get all recipes.
   */
  async getRecipes(businessId) {
    return await prisma.recipe.findMany({
      where: { businessId },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
        _count: { select: { productions: true } }
      }
    });
  }

  /**
   * Execute production: deduct raw materials and add finished goods.
   */
  async executeProduction({ recipeId, quantity, warehouseId, userId, businessId }) {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw Object.assign(new Error('Mahsulot miqdori musbat bo\'lishi kerak'), { statusCode: 400 });
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: parseInt(recipeId), businessId },
      include: { items: true }
    });

    if (!recipe) {
      throw Object.assign(new Error('Retsept topilmadi'), { statusCode: 404 });
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Check raw material availability and deduct
      for (const item of recipe.items) {
        const requiredQty = item.quantity * qty;
        const available = await stockService.checkAvailability(item.productId, warehouseId, requiredQty, businessId);
        
        if (!available) {
          const prod = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
          throw Object.assign(new Error(`Xomashyo yetarli emas: ${prod.name}`), { statusCode: 400 });
        }

        await stockService.adjustStock({
          productId: item.productId,
          warehouseId,
          businessId,
          quantity: -requiredQty,
          type: 'OUT',
          reason: `Ishlab chiqarish (Retsept: ${recipe.name})`,
          userId
        }, tx);
      }

      // 2. Add finished good
      await stockService.adjustStock({
        productId: recipe.productId,
        warehouseId,
        businessId,
        quantity: qty,
        type: 'IN',
        reason: `Ishlab chiqarish yakunlandi (Retsept: ${recipe.name})`,
        userId
      }, tx);

      // 3. Record production
      return await tx.production.create({
        data: {
          recipeId: parseInt(recipeId),
          businessId,
          quantity: qty,
          userId: parseInt(userId),
          warehouseId: parseInt(warehouseId),
          status: 'completed'
        },
        include: {
          recipe: { select: { name: true } },
          warehouse: { select: { name: true } }
        }
      });
    });
  }

  /**
   * Get production history.
   */
  async getProductionHistory(page = 1, limit = 50, businessId) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [productions, total] = await Promise.all([
      prisma.production.findMany({
        where: { businessId },
        include: {
          recipe: { select: { name: true, product: { select: { name: true } } } },
          warehouse: { select: { name: true } },
          user: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.production.count({ where: { businessId } })
    ]);

    return { productions, total, page: parseInt(page), limit: parseInt(limit) };
  }
}

module.exports = new ProductionService();
