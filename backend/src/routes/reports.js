const prisma = require('../prisma');
const { sendSuccess } = require('../services/response.utility');

async function reportRoutes(fastify) {
  // GET /api/reports/dashboard — umumiy statistikalar
  fastify.get('/dashboard', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { from, to } = request.query;
    const cacheKey = `report:dashboard:${from || 'all'}:${to || 'all'}`;
    
    // Try cache first
    let cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    let dateFilter = {};
    
    if (from && to) {
      dateFilter = { gte: new Date(from), lte: new Date(to + 'T23:59:59') };
    } else {
      const today = new Date(); today.setHours(0,0,0,0);
      dateFilter = { gte: today };
    }

    const today = new Date(); today.setHours(0,0,0,0);
    const week = new Date(); week.setDate(week.getDate() - 7);

    // Parallel aggregations - MUCH faster
    const [rangeSales, todaySales, weekSales, totalCustomers, totalProducts, activeOrders, pendingDebts, allPayments, lowStock, topDebtors, totalSalesRevenue] = await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: dateFilter, status: 'completed' } }),
      prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: today }, status: 'completed' } }),
      prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: week }, status: 'completed' } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: { in: ['new', 'ready'] } } }),
      prisma.debt.aggregate({ _sum: { amount: true }, _count: true, where: { status: { in: ['pending', 'overdue'] } } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 10 } },
        select: { id: true, name: true, stock: true, minStock: true },
        take: 10,
      }),
      prisma.debt.findMany({
        where: { status: { in: ['pending', 'overdue'] }, type: 'customer' },
        include: { customer: { select: { name: true } } },
        orderBy: { amount: 'desc' },
        take: 10,
      }),
      prisma.sale.aggregate({ 
        _sum: { total: true }, 
        where: { status: 'completed', paymentMethod: { in: ['cash', 'card', 'bank'] } } 
      })
    ]);

    const balance = (totalSalesRevenue._sum.total || 0) + (allPayments._sum.amount || 0);

    const result = {
      rangeSales: { total: rangeSales._sum.total || 0, count: rangeSales._count },
      todaySales: { total: todaySales._sum.total || 0, count: todaySales._count },
      weekSales: { total: weekSales._sum.total || 0, count: weekSales._count },
      totalCustomers, totalProducts, activeOrders,
      pendingDebts: { total: pendingDebts._sum.amount || 0, count: pendingDebts._count },
      lowStockProducts: lowStock,
      topDebtors,
      balance: Math.round(balance),
    };

    // Cache for 5 minutes
    await fastify.cache.set(cacheKey, result, 300);
    return sendSuccess(reply, result);
  });

  // GET /api/reports/sales?from=&to=
  fastify.get('/sales', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { from, to, groupBy = 'day' } = request.query;
    const cacheKey = `report:sales:${from || 'all'}:${to || 'all'}:${groupBy}`;
    
    // Try cache first
    let cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    const where = { status: 'completed' };
    if (from) where.createdAt = { gte: new Date(from) };
    if (to) where.createdAt = { ...where.createdAt, lte: new Date(to + 'T23:59:59') };

    // Optimized: only select needed fields
    const sales = await prisma.sale.findMany({
      where,
      select: { total: true, discount: true, paymentMethod: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day in code (faster than DB for small datasets)
    const grouped = {};
    for (const s of sales) {
      const key = s.createdAt.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = { date: key, total: 0, count: 0 };
      grouped[key].total += s.total;
      grouped[key].count += 1;
    }

    const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
    const byMethod = {};
    for (const s of sales) {
      byMethod[s.paymentMethod] = (byMethod[s.paymentMethod] || 0) + s.total;
    }

    const result = {
      chart: Object.values(grouped),
      totalRevenue: Math.round(totalRevenue),
      salesCount: sales.length,
      byMethod,
    };

    // Cache for 10 minutes
    await fastify.cache.set(cacheKey, result, 600);
    return sendSuccess(reply, result);
  });

  // GET /api/reports/top-products
  fastify.get('/top-products', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { limit = 10 } = request.query;
    const cacheKey = `report:top-products:${limit}`;
    
    // Try cache first
    let cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    // Use groupBy aggregate (faster than separate queries)
    const items = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: parseInt(limit),
    });
    
    if (items.length === 0) {
      return sendSuccess(reply, []);
    }

    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({ 
      where: { id: { in: productIds } }, 
      select: { id: true, name: true, sku: true }
    });

    const result = items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return { ...prod, totalQty: item._sum.quantity, totalRevenue: Math.round(item._sum.total) };
    });

    // Cache for 30 minutes
    await fastify.cache.set(cacheKey, result, 1800);
    return sendSuccess(reply, result);
  });

  // GET /api/reports/profit?from=&to=
  fastify.get('/profit', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { from, to } = request.query;
    const cacheKey = `report:profit:${from || 'all'}:${to || 'all'}`;
    
    // Try cache first
    let cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    const where = { status: 'completed' };
    if (from) where.createdAt = { gte: new Date(from) };
    if (to) where.createdAt = { ...where.createdAt, lte: new Date(to + 'T23:59:59') };

    // Optimized: fetch only needed fields
    const [items, totalExpenses] = await Promise.all([
      prisma.saleItem.findMany({
        where: { sale: where },
        select: {
          total: true,
          quantity: true,
          costPrice: true,
        }
      }),
      prisma.expense.aggregate({
        where: { createdAt: where.createdAt }, 
        _sum: { amount: true }
      })
    ]);

    let revenue = 0, cost = 0;
    for (const item of items) {
      revenue += item.total;
      cost += (item.costPrice || 0) * item.quantity;
    }

    const expensesAmount = totalExpenses._sum.amount || 0;
    const grossProfit = revenue - cost;
    const netProfit = grossProfit - expensesAmount;
    const margin = revenue > 0 ? Math.round(grossProfit / revenue * 100) : 0;

    const result = { 
      revenue: Math.round(revenue), 
      cost: Math.round(cost), 
      grossProfit: Math.round(grossProfit),
      expenses: Math.round(expensesAmount),
      netProfit: Math.round(netProfit), 
      margin 
    };

    // Cache for 30 minutes
    await fastify.cache.set(cacheKey, result, 1800);
    return sendSuccess(reply, result);
  });
}

module.exports = reportRoutes;
