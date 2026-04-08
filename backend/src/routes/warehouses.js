const prisma = require('../prisma');

async function warehouseCrudRoutes(fastify) {
  // GET /api/warehouses
  fastify.get('/', { preHandler: [fastify.authenticate] }, async () => {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { stocks: true } }
      }
    });
    return { success: true, data: warehouses };
  });

  // POST /api/warehouses
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name, address } = request.body;
    if (!name) return reply.status(400).send({ success: false, error: 'Nom kiritilishi shart' });

    try {
      const warehouse = await prisma.warehouse.create({
        data: { name, address }
      });
      return reply.status(201).send({ success: true, data: warehouse });
    } catch {
      return reply.status(400).send({ success: false, error: 'Bu nomli ombor allaqachon mavjud' });
    }
  });

  // PUT /api/warehouses/:id
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id);
    const { name, address, isActive } = request.body;
    
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: { name, address, isActive }
    });
    return { success: true, data: warehouse };
  });

  // DELETE /api/warehouses/:id
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id);
    // Tekshirish: omborda mahsulot bormi?
    const stockCount = await prisma.productStock.count({ where: { warehouseId: id, quantity: { gt: 0 } } });
    if (stockCount > 0) {
      return reply.status(400).send({ success: false, error: 'Omborda mahsulotlar borligi sababli o\'chirishning imkoni yo\'q' });
    }

    await prisma.warehouse.delete({ where: { id } });
    return { success: true, message: 'Ombor o\'chirildi' };
  });
}

module.exports = warehouseCrudRoutes;
