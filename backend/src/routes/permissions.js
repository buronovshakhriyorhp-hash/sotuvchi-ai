const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

async function permissionRoutes(fastify) {
  // Barcha vakolatlarni olish (Business isolated)
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const perms = await prisma.rolePermission.findMany({
        where: { businessId: request.user.businessId }
      });
      return sendSuccess(reply, perms);
    } catch (err) {
      return sendError(reply, 'Vakolatlarni yuklashda xatolik', 500);
    }
  });
 
  // Lavozim bo'yicha vakolatni yangilash (Admin only & Business isolated)
  fastify.put('/:role', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // SECURITY CHECK: Only ADMIN can change permissions for their business
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Bu amalni bajarish uchun ADMIN huquqi talab qilinadi', 403);
    }

    const { role } = request.params;
    const { permissions } = request.body; 
    const businessId = request.user.businessId;

    try {
      const updated = await prisma.rolePermission.upsert({
        where: { 
          role_businessId: {
            role: role.toUpperCase(),
            businessId: businessId
          }
        },
        update: { permissions },
        create: { 
          role: role.toUpperCase(), 
          businessId: businessId,
          permissions 
        }
      });
      
      return sendSuccess(reply, updated);
    } catch (err) {
      console.error('Update Permission Error:', err);
      return sendError(reply, 'Vakolatni saqlashda xatolik', 500);
    }
  });
}

module.exports = permissionRoutes;
