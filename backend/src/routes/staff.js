const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const { sendSuccess, sendError } = require('../services/response.utility');
const { logAction } = require('../services/audit.service');

const staffSchema = {
  body: {
    type: 'object',
    required: ['name', 'phone', 'password'],
    properties: {
      name: { type: 'string', minLength: 2 },
      phone: { type: 'string', minLength: 9 },
      // SEC-04: Minimum 8 belgi
      password: { type: 'string', minLength: 8 },
      role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'CASHIER', 'STOREKEEPER', 'ACCOUNTANT'], default: 'CASHIER' }
    }
  }
};

// SEC-13: Ruxsat etilgan rollar — SUPERADMIN TAQIQLANGAN
const ALLOWED_ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'STOREKEEPER', 'ACCOUNTANT'];

async function staffRoutes(fastify) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const staff = await prisma.user.findMany({
      where: { businessId: request.user.businessId },
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(reply, staff);
  });

  fastify.post('/', { preHandler: [fastify.authenticate], schema: staffSchema }, async (request, reply) => {
    // Only ADMIN can create staff
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Bu amalni bajarish uchun ADMIN huquqi talab qilinadi', 403);
    }
    const { name, phone, password, role } = request.body;
    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) return sendError(reply, 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan', 400);
    const passwordHash = await bcrypt.hash(password, 12); // SEC-08: rounds=12
    const safeRole = (role && ALLOWED_ROLES.includes(role.toUpperCase())) ? role.toUpperCase() : 'CASHIER';
    const user = await prisma.user.create({
      data: { name, phone, businessId: request.user.businessId, passwordHash, role: safeRole },
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    });

    // AUDIT LOG
    logAction({
      userId: request.user.id,
      businessId: request.user.businessId,
      action: 'CREATE_STAFF',
      entityType: 'User',
      entityId: user.id,
      newData: { name: user.name, phone: user.phone, role: user.role }
    });

    return sendSuccess(reply, user, 201);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // Only ADMIN can update staff
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Bu amalni bajarish uchun ADMIN huquqi talab qilinadi', 403);
    }
    const targetId = parseInt(request.params.id);
    const { name, role, isActive, password } = request.body;
    const data = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) {
      if (password.length < 8) return sendError(reply, 'Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak', 400);
      data.passwordHash = await bcrypt.hash(password, 12);
    }
    // SEC-13: Role escalation himoyasi — SUPERADMIN o'rnatish TAQIQLANGAN
    if (role) {
      if (!ALLOWED_ROLES.includes(role.toUpperCase())) {
        return sendError(reply, `Role "${role}" ruxsat etilmagan. Faqat: ${ALLOWED_ROLES.join(', ')}`, 400);
      }
      data.role = role.toUpperCase();
    }
    const oldUser = await prisma.user.findFirst({ where: { id: targetId, businessId: request.user.businessId } });
    if (!oldUser) return sendError(reply, 'Xodim topilmadi', 404);

    const user = await prisma.user.update({
      where: { id: targetId },
      data,
      select: { id: true, name: true, phone: true, role: true, isActive: true },
    });

    // AUDIT LOG
    logAction({
      userId: request.user.id,
      businessId: request.user.businessId,
      action: 'UPDATE_STAFF',
      entityType: 'User',
      entityId: user.id,
      oldData: { name: oldUser.name, role: oldUser.role, isActive: oldUser.isActive },
      newData: { name: user.name, role: user.role, isActive: user.isActive }
    });

    return sendSuccess(reply, user);
  });
}

module.exports = staffRoutes;
