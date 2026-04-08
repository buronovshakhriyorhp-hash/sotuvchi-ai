const prisma = require('../prisma');
const { sendSuccess } = require('../services/response.utility');

async function searchRoutes(fastify) {
  // GET /api/search?q=...
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { q } = request.query;
    if (!q || q.length < 2) return sendSuccess(reply, []);

    const query = q.toLowerCase();

    const [products, customers, sales] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { sku: { contains: query } },
          ],
        },
        take: 5,
        include: { category: true }
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        take: 5
      }),
      prisma.sale.findMany({
        where: {
          receiptNo: { contains: query.toUpperCase() }
        },
        take: 5,
        include: { customer: true }
      })
    ]);

    const results = [
      ...products.map(p => ({ type: 'Mahsulot', label: p.name, path: '/products/list', metadata: p.sku })),
      ...customers.map(c => ({ type: 'Mijoz', label: c.name, path: '/customers/list', metadata: c.phone })),
      ...sales.map(s => ({ type: 'Buyurtma', label: s.receiptNo, path: '/products/sales', metadata: s.customer?.name || 'Chakana' })),
    ];

    return sendSuccess(reply, results);
  });
}

module.exports = searchRoutes;
