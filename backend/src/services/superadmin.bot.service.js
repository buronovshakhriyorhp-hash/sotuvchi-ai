const { Bot, InlineKeyboard } = require('grammy');
const prisma = require('../prisma');
require('dotenv').config();

class SuperAdminBotService {
    constructor() {
        if (!process.env.SUPERADMIN_BOT_TOKEN) {
            console.warn('SUPERADMIN_BOT_TOKEN missing in .env');
            return;
        }

        this.bot = new Bot(process.env.SUPERADMIN_BOT_TOKEN);
        this.rootId = process.env.ROOT_ADMIN_ID;
        this.setupHandlers();
        
        this.bot.start().catch(err => console.error('SuperAdmin Bot failed to start:', err));
        console.log('✅ SuperAdmin Bot (Command Center) ishga tushdi.');
    }

    setupHandlers() {
        // middleware to check if user is root or a registered manager
        const authMiddleware = async (ctx, next) => {
            const userId = ctx.from?.id?.toString();
            if (userId === this.rootId) {
                ctx.state.isRoot = true;
                ctx.state.canApprove = true;
                ctx.state.canViewFeedback = true;
                return next();
            }

            const manager = await prisma.platformManager.findUnique({ where: { telegramId: userId } });
            if (manager) {
                ctx.state.isRoot = false;
                ctx.state.permissions = manager.permissions || {};
                return next();
            }

            // Not authorized
            if (ctx.message?.text === '/start') {
                return ctx.reply('🚫 <b>Ruxsat etilmagan.</b>\nSiz ushbu botning SuperAdmini emassiz.', { parse_mode: 'HTML' });
            }
        };

        this.bot.use(authMiddleware);

        // /start command
        this.bot.command('start', async (ctx) => {
            const welcome = ctx.state.isRoot 
                ? '👋 <b>Xush kelibsiz, Root Admin!</b>\nBu platforma boshqaruv markazi.' 
                : '👋 <b>Salom, Platforma Menejeri!</b>';
            
            const keyboard = new InlineKeyboard()
                .text('📝 Tasdiq kutayotganlar', 'pending_list')
                .text('💬 Mulohazalar', 'feedback_list').row()
                .text('📊 Statistika', 'global_stats');

            if (ctx.state.isRoot) {
                keyboard.row().text('➕ Menejer qo\'shish', 'add_manager_prompt');
            }

            await ctx.reply(welcome, { parse_mode: 'HTML', reply_markup: keyboard });
        });

        // /stats command
        this.bot.command('stats', async (ctx) => {
            if (!ctx.state.isRoot && !ctx.state.permissions?.VIEW_STATS) {
                return ctx.reply('Ruxsat yo\'q');
            }

            const bizCount = await prisma.business.count();
            const userCount = await prisma.user.count();
            const pendingCount = await prisma.business.count({ where: { isApproved: false } });
            const feedbackCount = await prisma.feedback.count({ where: { status: 'PENDING' } });

            let msg = '<b>📊 Tizim Statistikasi:</b>\n\n';
            msg += `🏪 Jami bizneslar: ${bizCount}\n`;
            msg += `👤 Jami foydalanuvchilar: ${userCount}\n`;
            msg += `⏳ Tasdiq kutayotganlar: ${pendingCount}\n`;
            msg += `💬 Yangi mulohazalar: ${feedbackCount}`;

            await ctx.reply(msg, { parse_mode: 'HTML' });
        });

        // /add_manager command (Root Only)
        this.bot.command('add_manager', async (ctx) => {
            if (!ctx.state.isRoot) return;

            const args = ctx.match?.split(' ');
            if (!args || args.length < 2) {
                return ctx.reply('⚠️ To\'g\'ri format: <code>/add_manager [tg_id] [ismi]</code>', { parse_mode: 'HTML' });
            }

            const [tgId, name] = args;
            try {
                await prisma.platformManager.create({
                    data: {
                        telegramId: tgId,
                        name: name,
                        permissions: { MANAGE_BUSINESSES: true, MANAGE_FEEDBACK: true, VIEW_STATS: true }
                    }
                });
                await ctx.reply(`✅ Menejer <b>${name}</b> (ID: ${tgId}) muvaffaqiyatli qo'shildi!`, { parse_mode: 'HTML' });
            } catch (err) {
                await ctx.reply('❌ Xato: Menejer allaqachon mavjud yoki ID noto\'g\'ri.');
            }
        });

        // Callback queries
        this.bot.callbackQuery('global_stats', async (ctx) => {
            const bizCount = await prisma.business.count();
            const pendingCount = await prisma.business.count({ where: { isApproved: false } });
            await ctx.reply(`📊 Jami do'konlar: ${bizCount}\n⏳ Kutilmoqda: ${pendingCount}`);
            await ctx.answerCallbackQuery();
        });

        this.bot.callbackQuery('pending_list', async (ctx) => {
            if (!ctx.state.isRoot && !ctx.state.permissions?.MANAGE_BUSINESSES) {
                return ctx.answerCallbackQuery('Ruxsat yo\'q');
            }

            const pending = await prisma.business.findMany({
                where: { isApproved: false },
                orderBy: { createdAt: 'desc' },
                take: 10
            });

            if (pending.length === 0) {
                return ctx.reply('📭 Tasdiq kutayotgan do\'konlar hozircha yo\'q.');
            }

            for (const biz of pending) {
                const msg = `🏪 <b>${biz.name}</b>\nID: <code>${biz.id}</code>\n📱 ${biz.ownerPhone}\n📅 ${biz.createdAt.toLocaleDateString()}`;
                const kb = new InlineKeyboard().text('✅ Tasdiqlash', `approve_${biz.id}`);
                await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: kb });
            }
            await ctx.answerCallbackQuery();
        });

        // Dynamic callback for reading feedback
        this.bot.on('callback_query:data', async (ctx) => {
            const data = ctx.callbackQuery.data;

            if (data.startsWith('read_feedback_')) {
                const id = parseInt(data.replace('read_feedback_', ''));
                await prisma.feedback.update({ where: { id }, data: { status: 'READ' } });
                await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n✅ <i>O\'qildi deb belgilandi.</i>', { parse_mode: 'HTML' });
                await ctx.answerCallbackQuery();
            }
        });
    }

    // Helper to notify core admin about new signup
    async notifyNewSignup(business) {
        if (!this.bot) return;
        const msg = `🆕 <b>Yangi do'kon ochildi!</b>\n\n🏪 Nomi: <b>${business.name}</b>\n📱 Tel: ${business.ownerPhone}\n🌍 Slug: ${business.slug}\n\nNazorat qilish uchun /start ni bosing.`;
        
        try {
            await this.bot.api.sendMessage(this.rootId, msg, { parse_mode: 'HTML' });
        } catch (err) {
            console.error('Failed to notify Root Admin via Bot:', err.message);
        }
    }

    // Helper to notify admin about feedback
    async notifyNewFeedback(feedback, businessName) {
        if (!this.bot) return;
        const icon = feedback.category === 'COMPLAINT' ? '🔴' : (feedback.category === 'ERROR' ? '❌' : '🔵');
        const msg = `💬 <b>Yangi fikr-mulohaza!</b>\n\n🏪 <b>${businessName}</b>\n${icon} Toifa: ${feedback.category}\n📝 Matn: ${feedback.content}`;
        
        try {
            await this.bot.api.sendMessage(this.rootId, msg, { parse_mode: 'HTML' });
        } catch (err) {
            console.error('Failed to notify Admin about feedback:', err.message);
        }
    }
}

module.exports = new SuperAdminBotService();
