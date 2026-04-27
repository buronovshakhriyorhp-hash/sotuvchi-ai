const prisma = require('../prisma');
const { sendSuccess } = require('../services/response.utility');

async function reportRoutes(fastify) {
  // GET /api/reports/dashboard — umumiy statistikalar
  fastify.get('/dashboard', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { from, to } = request.query;
    const businessId = request.user.businessId;
    const cacheKey = `report:dashboard:${businessId}:${from || 'all'}:${to || 'all'}`;
    
    // Try cache first
    let cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);

    let dateFilter = {};
    if (from && to) {
      dateFilter = { gte: new Date(from), lte: new Date(to + 'T23:59:59') };
    } else {
      dateFilter = { gte: todayStart };
    }

    const [rangeSales, todaySales, weekSales, totalCustomers, totalProducts, activeOrders, pendingDebts, allPayments, lowStock, topDebtors] = await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { businessId, createdAt: dateFilter, status: 'completed' } }),
      prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { businessId, createdAt: { gte: todayStart }, status: 'completed' } }),
      prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { businessId, createdAt: { gte: weekStart }, status: 'completed' } }),
      prisma.customer.count({ where: { businessId, isActive: true } }),
      prisma.product.count({ where: { businessId, isActive: true } }),
      prisma.order.count({ where: { businessId, status: { in: ['new', 'ready'] } } }),
      prisma.debt.aggregate({ _sum: { amount: true, paidAmount: true }, _count: true, where: { businessId, status: { in: ['pending', 'partial', 'overdue'] } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { debt: { businessId } } }),
      prisma.product.findMany({
        where: { businessId, isActive: true, stock: { lte: 10 } },
        select: { id: true, name: true, stock: true, minStock: true },
        take: 5,
        orderBy: { stock: 'asc' }
      }),
      prisma.debt.findMany({
        where: { businessId, status: { not: 'paid' }, type: 'customer' },
        include: { customer: { select: { name: true } } },
        orderBy: { amount: 'desc' },
        take: 5,
      }),
    ]);

    // Top Customers (Optimized: No N+1)
    const topCustomersRaw = await prisma.sale.groupBy({
      by: ['customerId'],
      _sum: { total: true },
      where: { businessId, status: 'completed', customerId: { not: null } },
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    });

    const customerIds = topCustomersRaw.map(c => c.customerId);
    const customersInfo = await prisma.customer.findMany({
      where: { id: { in: customerIds }, businessId },
      select: { id: true, name: true }
    });

    const topCustomers = topCustomersRaw.map(c => {
      const info = customersInfo.find(cu => cu.id === c.customerId);
      return { id: c.customerId, name: info?.name || 'Noma\'lum', total: c._sum.total };
    });

    // Payment Breakdown — barcha to'lov usullari: cash, card, bank, debt
    const paymentMethods = await prisma.sale.aggregate({
      _sum: { cashAmount: true, cardAmount: true, bankAmount: true, debtAmount: true },
      where: { businessId, createdAt: dateFilter, status: 'completed' }
    });

    // Upcoming Debts (Alerts)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const upcomingDebts = await prisma.debt.findMany({
      where: { businessId, status: { in: ['pending', 'partial', 'overdue'] }, dueDate: { lte: threeDaysLater } },
      include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
      take: 5
    });

    // Balans: Naqd + Karta + Bank o'tkazmasi + Qarz to'lovlari
    const directIncome = await prisma.sale.aggregate({
      _sum: { cashAmount: true, cardAmount: true, bankAmount: true },
      where: { businessId, status: 'completed' }
    });
    
    const balance = 
      (directIncome._sum.cashAmount || 0) + 
      (directIncome._sum.cardAmount || 0) + 
      (directIncome._sum.bankAmount || 0) + 
      (allPayments._sum.amount || 0);

    const result = {
      rangeSales: { total: rangeSales._sum.total || 0, count: rangeSales._count },
      todaySales: { total: todaySales._sum.total || 0, count: todaySales._count },
      weekSales: { total: weekSales._sum.total || 0, count: weekSales._count },
      totalCustomers, totalProducts, activeOrders,
      pendingDebts: { 
        total: (pendingDebts._sum.amount || 0) - (pendingDebts._sum.paidAmount || 0), 
        count: pendingDebts._count 
      },
      lowStockProducts: lowStock,
      topDebtors,
      topCustomers,
      paymentBreakdown: {
        cash:  paymentMethods._sum.cashAmount  || 0,
        card:  paymentMethods._sum.cardAmount  || 0,
        bank:  paymentMethods._sum.bankAmount  || 0,
        debt:  paymentMethods._sum.debtAmount  || 0,
      },
      alerts: {
        lowStock: lowStock.length,
        upcomingDebts: upcomingDebts.map(d => ({
          id: d.id,
          name: d.customer?.name || d.supplier?.name || 'Noma\'lum',
          amount: d.amount - d.paidAmount,
          dueDate: d.dueDate
        }))
      },
      balance: Math.round(balance),
      zeroCostProducts: await prisma.product.count({ where: { businessId, isActive: true, costPrice: 0 } })
    };

    // Cache for 5 minutes
    await fastify.cache.set(cacheKey, result, 300);
    return sendSuccess(reply, result);
  });

  // GET /api/reports/sales?from=&to=
  fastify.get('/sales', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { from, to, groupBy = 'day' } = request.query;
    const businessId = request.user.businessId;
    const cacheKey = `report:sales:${businessId}:${from || 'all'}:${to || 'all'}:${groupBy}`;
    
    // Try cache first
    let cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    const where = { businessId, status: 'completed' };
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
    const businessId = request.user.businessId;
    const cacheKey = `report:top-products:${businessId}:${limit}`;
    
    // Try cache first
    let cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    // Use groupBy aggregate (faster than separate queries)
    const items = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      where: { sale: { businessId, status: 'completed' } },
      orderBy: { _sum: { total: 'desc' } },
      take: parseInt(limit),
    });
    
    if (items.length === 0) {
      return sendSuccess(reply, []);
    }

    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({ 
      where: { id: { in: productIds }, businessId }, 
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
    const businessId = request.user.businessId;
    const cacheKey = `report:profit:${businessId}:${from || 'all'}:${to || 'all'}`;
    
    // Try cache first
    let cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    // Optimized Profit Calculation
    const fromStr = from ? new Date(from).toISOString() : '1970-01-01T00:00:00Z';
    const toStr = to ? new Date(to + 'T23:59:59').toISOString() : new Date().toISOString();
    
    // Define dateFilter for Prisma aggregate
    const dateFilter = { 
      gte: new Date(fromStr), 
      lte: new Date(toStr) 
    };

    const [profitStats, totalExpenses] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          CAST(SUM(si.total) AS FLOAT) as revenue,
          CAST(SUM(si.quantity * COALESCE(si."unitPrice", 0)) AS FLOAT) as gross_revenue,
          CAST(SUM(si.quantity * COALESCE(p."costPrice", 0)) AS FLOAT) as cost
        FROM "SaleItem" si
        JOIN "Sale" s ON s.id = si."saleId"
        JOIN "Product" p ON p.id = si."productId"
        WHERE s."businessId" = ${parseInt(businessId)} 
          AND s.status = 'completed'
          AND s."createdAt" >= ${new Date(fromStr)}
          AND s."createdAt" <= ${new Date(toStr)}
      `,
      prisma.expense.aggregate({
        where: { businessId, date: dateFilter }, 
        _sum: { amount: true }
      })
    ]);

    const stats = profitStats[0] || { revenue: 0, cost: 0 };
    const revenue = stats.revenue || 0;
    const cost = stats.cost || 0;
    const expensesAmount = totalExpenses._sum.amount || 0;
    const grossProfit = revenue - cost;
    const netProfit = grossProfit - expensesAmount;
    const margin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

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

  // GET /api/reports/balance — Faqat balansni qaytaradi (Lightweight)
  fastify.get('/balance', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const businessId = request.user.businessId;
    const cacheKey = `report:balance:${businessId}`;

    let cached = await fastify.cache.get(cacheKey);
    if (cached !== null) return sendSuccess(reply, { balance: cached });

    // Calculate balance efficiently
    const [directIncome, allPayments] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { cashAmount: true, cardAmount: true, bankAmount: true },
        where: { businessId, status: 'completed' }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { debt: { businessId } }
      })
    ]);

    const balance = Math.round(
      (directIncome._sum.cashAmount || 0) + 
      (directIncome._sum.cardAmount || 0) + 
      (directIncome._sum.bankAmount || 0) + 
      (allPayments._sum.amount || 0)
    );

    // Cache for 2 minutes (Short TTL because balance changes frequently)
    await fastify.cache.set(cacheKey, balance, 120);
    
    return sendSuccess(reply, { balance });
  });
}

module.exports = reportRoutes;
