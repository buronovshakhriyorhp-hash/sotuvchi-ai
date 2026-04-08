const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

const loginSchema = {
  body: {
    type: 'object',
    required: ['phone', 'password'],
    properties: {
      phone: { type: 'string', minLength: 9 },
      password: { type: 'string', minLength: 8 }
    }
  }
};

async function authRoutes(fastify) {
  // POST /api/auth/login
  fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
    const { phone, password } = request.body;

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || !user.isActive) {
      return sendError(reply, 'Foydalanuvchi topilmadi yoki nofaol', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return sendError(reply, 'Parol noto\'g\'ri', 401);
    }

    const token = fastify.jwt.sign({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    });

    return sendSuccess(reply, {
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
  });

  // GET /api/auth/me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    return sendSuccess(reply, user);
  });

  // POST /api/auth/change-password
  fastify.post('/change-password', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body;
    const user = await prisma.user.findUnique({ where: { id: request.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return sendError(reply, 'Joriy parol noto\'g\'ri', 400);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: request.user.id }, data: { passwordHash } });
    return sendSuccess(reply, 'Parol muvaffaqiyatli o\'zgartirildi');
  });
}

module.exports = authRoutes;
