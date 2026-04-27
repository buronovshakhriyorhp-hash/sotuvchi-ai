const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

async function businessRoutes(fastify) {
  // GET /api/business/settings
  fastify.get('/settings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const business = await prisma.business.findUnique({
        where: { id: request.user.businessId },
        select: { 
          id: true, 
          name: true, 
          settings: true,
          ownerPhone: true
        }
      });

      if (!business) return sendError(reply, 'Biznes topilmadi', 404);

      return sendSuccess(reply, business);
    } catch (err) {
      return sendError(reply, err.message);
    }
  });

  // PATCH /api/business/settings (Restricted to ADMIN)
  fastify.patch('/settings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      if (request.user.role !== 'ADMIN') {
        return sendError(reply, 'Bu amalni bajarish uchun ADMIN huquqi talab qilinadi', 403);
      }
      const { settings, name } = request.body;
      
      const currentBusiness = await prisma.business.findUnique({
        where: { id: request.user.businessId }
      });

      if (!currentBusiness) return sendError(reply, 'Biznes topilmadi', 404);

      // Merge settings
      const updatedSettings = {
        ...(currentBusiness.settings || {}),
        ...(settings || {})
      };

      const updated = await prisma.business.update({
        where: { id: request.user.businessId },
        data: { 
          name: name || currentBusiness.name,
          settings: updatedSettings
        }
      });

      // Clear related report caches as settings (like currency) might affect calculations
      await fastify.cache.invalidateEntity('report', request.user.businessId);

      return sendSuccess(reply, {
        message: 'Sozlamalar muvaffaqiyatli saqlandi',
        business: updated
      });
    } catch (err) {
      return sendError(reply, err.message);
    }
  });
}

module.exports = businessRoutes;
