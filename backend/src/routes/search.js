const prisma = require('../prisma');
const { sendSuccess } = require('../services/response.utility');

async function searchRoutes(fastify) {
  // GET /api/search?q=...
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { q } = request.query;
    if (!q || q.length < 2) return sendSuccess(reply, []);

    const query = q.toLowerCase();
    const businessId = request.user.businessId;
    const cacheKey = `search:${businessId}:${query}`;

    // Try cache first (search results cached for 2 minutes for frequently searched items)
    const cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    // Parallel queries with minimal field selection
    const [products, customers, sales] = await Promise.all([
      prisma.product.findMany({
        where: {
          businessId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, sku: true, categoryId: true, category: { select: { name: true } } },
        take: 5,
      }),
      prisma.customer.findMany({
        where: {
          businessId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, phone: true },
        take: 5
      }),
      prisma.sale.findMany({
        where: {
          businessId,
          receiptNo: { contains: query.toUpperCase(), mode: 'insensitive' }
        },
        select: { id: true, receiptNo: true, customerId: true, customer: { select: { name: true } } },
        take: 5,
      })
    ]);

    const results = [
      ...products.map(p => ({ type: 'Mahsulot', label: p.name, path: '/products/list', metadata: p.sku })),
      ...customers.map(c => ({ type: 'Mijoz', label: c.name, path: '/customers/list', metadata: c.phone })),
      ...sales.map(s => ({ type: 'Savdo', label: s.receiptNo, path: '/products/sales', metadata: s.customer?.name || 'Chakana' })),
    ];

    // Cache for 2 minutes
    await fastify.cache.set(cacheKey, results, 120);
    return sendSuccess(reply, results);
  });
}

module.exports = searchRoutes;
