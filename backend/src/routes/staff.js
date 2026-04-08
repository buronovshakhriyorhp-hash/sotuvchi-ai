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
      password: { type: 'string', minLength: 4 },
      role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'CASHIER', 'STOREKEEPER', 'ACCOUNTANT'], default: 'CASHIER' }
    }
  }
};

async function staffRoutes(fastify) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const staff = await prisma.user.findMany({
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(reply, staff);
  });

  fastify.post('/', { preHandler: [fastify.authenticate], schema: staffSchema }, async (request, reply) => {
    const { name, phone, password, role } = request.body;
    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) return sendError(reply, 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan', 400);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, phone, passwordHash, role: role || 'CASHIER' },
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    });

    // AUDIT LOG
    logAction({
      userId: request.user.id,
      action: 'CREATE_STAFF',
      entityType: 'User',
      entityId: user.id,
      newData: user
    });

    return sendSuccess(reply, user, 201);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name, role, isActive, password } = request.body;
    const data = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const oldUser = await prisma.user.findUnique({ where: { id: parseInt(request.params.id) } });

    const user = await prisma.user.update({
      where: { id: parseInt(request.params.id) },
      data,
      select: { id: true, name: true, phone: true, role: true, isActive: true },
    });

    // AUDIT LOG
    logAction({
      userId: request.user.id,
      action: 'UPDATE_STAFF',
      entityType: 'User',
      entityId: user.id,
      oldData: oldUser,
      newData: user
    });

    return sendSuccess(reply, user);
  });
}

module.exports = staffRoutes;
