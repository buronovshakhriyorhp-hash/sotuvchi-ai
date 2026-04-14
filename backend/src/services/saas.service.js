const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const superAdminBot = require('./superadmin.bot.service');

class SaasService {
    /**
     * Converts a string to a URL-friendly slug
     */
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-')     // Replace multiple - with single -
            .slice(0, 50);            // Limit length
    }

    /**
     * Unique slug kafolatlaydi \u2014 race condition-safe yondashuv.
     * Retry loop + Prisma P2002 xatosini ushlash bilan optimistik strategiya.
     */
    async ensureUniqueSlug(baseSlug, attempt = 0) {
        const suffix = attempt === 0 ? '' : `-${Math.floor(1000 + Math.random() * 9000)}`;
        const candidate = `${baseSlug}${suffix}`.slice(0, 50);

        try {
            const exists = await prisma.business.findUnique({ where: { slug: candidate } });
            if (!exists) return candidate;

            // Slug band \u2014 yangi suffix bilan qayta urinish
            if (attempt >= 5) throw new Error('Slug generatsiyasi muvaffaqiyatsiz. Biznes nomini o\u2018zgartiring.');
            return this.ensureUniqueSlug(baseSlug, attempt + 1);
        } catch (err) {
            // Prisma unique constraint violation (P2002) \u2014 race condition yuz berdi, qayta urinish
            if (err?.code === 'P2002' && attempt < 5) {
                return this.ensureUniqueSlug(baseSlug, attempt + 1);
            }
            throw err;
        }
    }

    /**
     * Registers a new business and its admin user (Initial state: Inactive)
     */
    async registerBusiness(data) {
        const { storeName, adminName, phone, password } = data;

        // 1. Validation
        if (!storeName || !adminName || !phone || !password) {
            throw Object.assign(new Error('Barcha maydonlar to\'ldirilishi shart'), { statusCode: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
            throw Object.assign(new Error('Ushbu telefon raqami allaqachon ro\'yxatdan o\'tgan'), { statusCode: 400 });
        }

        // 2. Slugification
        const baseSlug = this.slugify(storeName);
        const finalSlug = await this.ensureUniqueSlug(baseSlug);

        // 3. Transactional Creation
        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

        return await prisma.$transaction(async (tx) => {
            // Create Business — avtomatik faollashtirish (30 kunlik trial)
            const business = await tx.business.create({
                data: {
                    name: storeName,
                    slug: finalSlug,
                    ownerPhone: phone,
                    isActive: true,
                    isApproved: true,
                    approvedAt: new Date(),
                    trialExpiresAt,
                    settings: { storeName, onboarding: 'completed' }
                }
            });

            // Create Admin User — darhol faol
            const passwordHash = await bcrypt.hash(password, 10);
            const user = await tx.user.create({
                data: {
                    name: adminName,
                    phone: phone,
                    passwordHash,
                    role: 'ADMIN',
                    businessId: business.id,
                    isActive: true
                }
            });

            // Create Default Data (Bootstrap)
            await tx.warehouse.create({
                data: {
                    name: 'Asosiy Ombor',
                    businessId: business.id,
                    isActive: true
                }
            });

            await tx.category.create({
                data: {
                    name: 'Umumiy',
                    businessId: business.id
                }
            });

            const res = {
                businessId: business.id,
                slug: business.slug,
                owner: user.name,
                phone: user.phone,
                status: 'Faol (Trial)',
                trialExpiresAt
            };

            // Notify Admin (async)
            superAdminBot.notifyNewSignup({
                id: business.id,
                name: business.name,
                ownerPhone: business.ownerPhone,
                slug: business.slug
            }).catch(() => {});

            return res;
        });
    }

    /**
     * Submits feedback from a tenant
     */
    async submitFeedback(businessId, userId, data) {
        const { category, content } = data;
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        
        const feedback = await prisma.feedback.create({
            data: {
                businessId,
                userId,
                category: category || 'SUGGESTION',
                content
            }
        });

        // Notify SuperAdmin Bot
        superAdminBot.notifyNewFeedback(feedback, business.name).catch(() => {});

        return feedback;
    }

    /**
     * Lists all businesses awaiting approval
     */
    async getPendingBusinesses() {
        return await prisma.business.findMany({
            where: { isApproved: false },
            include: {
                _count: { select: { users: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Activates a business and sets trial period
     */
    async approveBusiness(id) {
        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

        return await prisma.$transaction(async (tx) => {
            const business = await tx.business.update({
                where: { id: parseInt(id) },
                data: { 
                    isApproved: true, 
                    isActive: true, 
                    approvedAt: new Date(), 
                    trialExpiresAt 
                }
            });

            // Biznes foydalanuvchilarini ham faollashtirish
            await tx.user.updateMany({
                where: { businessId: business.id },
                data: { isActive: true }
            });

            return business;
        });
    }
}

module.exports = new SaasService();
