const prisma = require('../prisma');
const saasService = require('../services/saas.service');
const { sendSuccess, sendError } = require('../services/response.utility');

async function saasRoutes(fastify) {
    // SEC-14: Register rate-limit — spam/DoS oldini olish
    fastify.post('/register', {
        config: {
            rateLimit: {
                max: 3,
                timeWindow: '10 minutes',
                errorResponseBuilder: () => ({
                    success: false,
                    error: 'Juda ko\'p urinish. 10 daqiqa kuting.'
                })
            }
        }
    }, async (request, reply) => {
        try {
            const result = await saasService.registerBusiness(request.body);
            return sendSuccess(reply, result, 201);
        } catch (error) {
            return sendError(reply, error.message, error.statusCode || 500);
        }
    });

    // 2. PUBLIC: Submit feedback from a tenant
    fastify.post('/feedback', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const result = await saasService.submitFeedback(request.user.businessId, request.user.id, request.body);
            return sendSuccess(reply, result, 201);
        } catch (error) {
            return sendError(reply, error.message);
        }
    });

    // 3. PROTECTED: Get pending businesses
    fastify.get('/pending', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role !== 'SUPERADMIN') {
            return sendError(reply, 'Bu amalni bajarish uchun SuperAdmin huquqi talab qilinadi', 403);
        }

        try {
            const businesses = await saasService.getPendingBusinesses();
            return sendSuccess(reply, businesses);
        } catch (error) {
            return sendError(reply, error.message);
        }
    });

    // 4. PROTECTED: Approve a business
    fastify.post('/approve/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role !== 'SUPERADMIN') {
            return sendError(reply, 'Bu amalni bajarish uchun SuperAdmin huquqi talab qilinadi', 403);
        }

        try {
            const result = await saasService.approveBusiness(request.params.id);
            return sendSuccess(reply, {
                message: 'Biznes muvaffaqiyatli tasdiqlandi va 30 kunlik sinov muddati berildi',
                businessId: result.id,
                name: result.name
            });
        } catch (error) {
            return sendError(reply, error.message);
        }
    });

    // 5. PROTECTED: Get all businesses
    fastify.get('/businesses', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role !== 'SUPERADMIN') {
            return sendError(reply, 'Bu amalni bajarish uchun SuperAdmin huquqi talab qilinadi', 403);
        }

        try {
            const businesses = await prisma.business.findMany({
                include: {
                    _count: { select: { users: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            return sendSuccess(reply, businesses);
        } catch (error) {
            return sendError(reply, error.message);
        }
    });

    // 6. PROTECTED: Get SaaS Stats
    fastify.get('/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role !== 'SUPERADMIN') {
            return sendError(reply, 'Bu amalni bajarish uchun SuperAdmin huquqi talab qilinadi', 403);
        }

        try {
            const totalBusinesses = await prisma.business.count();
            const activeBusinesses = await prisma.business.count({ where: { isActive: true, isApproved: true } });
            const pendingBusinesses = await prisma.business.count({ where: { isApproved: false } });
            const totalUsers = await prisma.user.count();

            return sendSuccess(reply, {
                totalBusinesses,
                activeBusinesses,
                pendingBusinesses,
                totalUsers
            });
        } catch (error) {
            return sendError(reply, error.message);
        }
    });

    // 7. PROTECTED: Get specific business users
    fastify.get('/businesses/:id/users', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role !== 'SUPERADMIN') {
            return sendError(reply, 'Bu amalni bajarish uchun SuperAdmin huquqi talab qilinadi', 403);
        }

        try {
            const users = await prisma.user.findMany({
                where: { businessId: parseInt(request.params.id) },
                select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true }
            });
            return sendSuccess(reply, users);
        } catch (error) {
            return sendError(reply, error.message);
        }
    });
    // 8. PROTECTED: Suspend / Activate a business
    fastify.post('/suspend/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role !== 'SUPERADMIN') {
            return sendError(reply, 'SuperAdmin huquqi talab qilinadi', 403);
        }
        const { activate } = request.body || {};
        try {
            const business = await prisma.business.update({
                where: { id: parseInt(request.params.id) },
                data: { isActive: !!activate }
            });
            // Foydalanuvchilarni ham yangilash
            await prisma.user.updateMany({
                where: { businessId: business.id },
                data: { isActive: !!activate }
            });
            return sendSuccess(reply, {
                message: activate ? 'Biznes faollashtirildi' : "Biznes to'xtatildi",
                businessId: business.id,
                isActive: business.isActive
            });
        } catch (error) {
            return sendError(reply, error.message);
        }
    });

    // 9. PROTECTED: Extend trial period
    fastify.post('/extend/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role !== 'SUPERADMIN') {
            return sendError(reply, 'SuperAdmin huquqi talab qilinadi', 403);
        }
        const days = parseInt(request.body?.days) || 30;
        try {
            const business = await prisma.business.findUnique({
                where: { id: parseInt(request.params.id) }
            });
            if (!business) return sendError(reply, 'Biznes topilmadi', 404);

            const baseDate = business.trialExpiresAt && business.trialExpiresAt > new Date()
                ? business.trialExpiresAt
                : new Date();
            const trialExpiresAt = new Date(baseDate);
            trialExpiresAt.setDate(trialExpiresAt.getDate() + days);

            const updated = await prisma.business.update({
                where: { id: parseInt(request.params.id) },
                data: { trialExpiresAt, isActive: true }
            });
            return sendSuccess(reply, {
                message: `Trial ${days} kunga uzaytirildi`,
                trialExpiresAt: updated.trialExpiresAt
            });
        } catch (error) {
            return sendError(reply, error.message);
        }
    });
}

module.exports = saasRoutes;
