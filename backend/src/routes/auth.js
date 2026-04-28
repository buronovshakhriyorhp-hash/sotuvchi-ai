const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

const loginSchema = {
  body: {
    type: 'object',
    required: ['phone', 'password'],
    properties: {
      phone: { type: 'string', minLength: 9 },
      // SEC-04: Minimum 8 belgi — biznes ERP uchun shart
      password: { type: 'string', minLength: 8 }
    }
  }
};

async function authRoutes(fastify) {
  // POST /api/auth/login
  // Rate-limit: 1 daqiqada max 10 urinish (brute-force himoyasi)
  fastify.post('/login', {
    schema: loginSchema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
          success: false,
          error: 'Juda ko\'p urinish. Iltimos, 1 daqiqa kuting.'
        })
      }
    }
  }, async (request, reply) => {
    const { phone, password } = request.body;

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || !user.isActive) {
      return sendError(reply, 'Foydalanuvchi topilmadi yoki nofaol', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return sendError(reply, 'Parol noto\'g\'ri', 401);
    }

    // SEC-09: JWT da faqat zaruriy ma'lumotlar — PII (name, phone) KIRITILMAYDI
    // JWT base64 dekod qilinadi, shuning uchun shaxsiy ma'lumotlar ochiq bo'lmasligi kerak
    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      businessId: user.businessId,
    });

    return sendSuccess(reply, {
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, businessId: user.businessId },
    });
  });

  // GET /api/auth/me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, name: true, phone: true, role: true, businessId: true, isActive: true, createdAt: true },
    });
    return sendSuccess(reply, user);
  });

  // POST /api/auth/change-password
  // SEC-12: Parol o'zgartirish rate-limited (brute-force oldini olish)
  fastify.post('/change-password', {
    preHandler: [fastify.authenticate],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes',
        errorResponseBuilder: () => ({
          success: false,
          error: 'Juda ko\'p urinish. 5 daqiqa kuting.'
        })
      }
    }
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body || {};
    if (!currentPassword || !newPassword) {
      return sendError(reply, 'Joriy parol va yangi parol kiritilishi shart', 400);
    }
    // SEC-04: Parol kuchi — minimum 8 belgi
    if (newPassword.length < 8) {
      return sendError(reply, 'Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak', 400);
    }
    const user = await prisma.user.findUnique({ where: { id: request.user.id } });
    if (!user || !user.isActive) return sendError(reply, 'Foydalanuvchi topilmadi yoki nofaol', 401);
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return sendError(reply, 'Joriy parol noto\'g\'ri', 400);
    // SEC-08: bcrypt rounds = 12 (OWASP 2024 tavsiyasi)
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: request.user.id }, data: { passwordHash } });
    return sendSuccess(reply, 'Parol muvaffaqiyatli o\'zgartirildi');
  });
}

module.exports = authRoutes;
