const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

async function permissionRoutes(fastify) {
  // Barcha vakolatlarni olish
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const perms = await prisma.rolePermission.findMany();
      return sendSuccess(reply, perms);
    } catch (err) {
      return sendError(reply, 'Vakolatlarni yuklashda xatolik', 500);
    }
  });

  // Lavozim bo'yicha vakolatni yangilash
  fastify.put('/:role', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { role } = request.params;
    const { permissions } = request.body; // JSON string kutiladi

    try {
      const updated = await prisma.rolePermission.upsert({
        where: { role: role.toUpperCase() },
        update: { permissions },
        create: { role: role.toUpperCase(), permissions }
      });
      
      return sendSuccess(reply, updated);
    } catch (err) {
      console.error('Update Permission Error:', err);
      return sendError(reply, 'Vakolatni saqlashda xatolik', 500);
    }
  });
}

module.exports = permissionRoutes;
