const { Bot, InlineKeyboard, Keyboard } = require('grammy');
const prisma = require('../prisma');
const pdfService = require('./pdf.service');

class BotService {
    constructor() {
        this.adminToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^"|"$/g, '');
        this.clientToken = (process.env.TELEGRAM_CLIENT_BOT_TOKEN || '').trim().replace(/^"|"$/g, '');

        this.adminBot = this.adminToken ? new Bot(this.adminToken) : null;
        this.clientBot = this.clientToken ? new Bot(this.clientToken) : null;

        this.initAdminBot();
        this.initClientBot();
        
        setInterval(() => this.runTicker(), 60000);
    }

    // --- ADMIN BOT ---
    async initAdminBot() {
        if (!this.adminBot) return;
        try {
            console.log(`✅ Admin Bot (SaaS) ishga tushdi.`);

            this.adminBot.command('start', (ctx) => this.handleAdminStart(ctx));
            
            // Doimiy tugmalar mantiqi
            this.adminBot.hears('📊 Bugun', (ctx) => this.handleAdminReportToday(ctx));
            this.adminBot.hears('💰 Balans', (ctx) => this.handleAdminBalance(ctx));
            this.adminBot.hears('💸 Xarajatlar', (ctx) => this.handleAdminExpensesDetails(ctx));
            this.adminBot.hears('📈 Haftallik', (ctx) => this.handleAdminReportWeekly(ctx));
            this.adminBot.hears('📉 Zaxiralar', (ctx) => this.handleAdminLowStock(ctx));
            this.adminBot.hears('🔝 Top Mahsulotlar', (ctx) => this.handleAdminTopProducts(ctx));
            this.adminBot.hears('🔍 Mijoz qidirish', (ctx) => ctx.reply("📱 Mijozning telefon raqamini yuboring (Masalan: 901234567):"));
            this.adminBot.hears('⚙️ Sozlamalar', (ctx) => this.handleAdminSettingsMenu(ctx));
            this.adminBot.hears('📋 Menyu', (ctx) => this.sendAdminMainMenu(ctx));

            // Callbacklar va boshqalar
            this.adminBot.callbackQuery(/^toggle_reg_(.+)/, (ctx) => this.handleToggleRegistration(ctx));
            this.adminBot.callbackQuery('admin_settings', (ctx) => this.handleAdminSettingsMenu(ctx));
            this.adminBot.on(':contact', (ctx) => this.handleAdminContact(ctx));
            this.adminBot.on('message:text', (ctx) => this.handleAdminMessage(ctx));

            this.adminBot.catch((err) => console.error('⚠️ Admin Bot Error:', err));
            this.adminBot.start({ drop_pending_updates: true });
        } catch (error) {
            console.error('❌ Admin Bot Init Error:', error.message);
        }
    }

    async sendAdminMainMenu(ctx) {
        const keyboard = new Keyboard()
            .text("📊 Bugun").text("💰 Balans").row()
            .text("💸 Xarajatlar").text("📈 Haftallik").row()
            .text("📉 Zaxiralar").text("🔝 Top Mahsulotlar").row()
            .text("🔍 Mijoz qidirish").text("⚙️ Sozlamalar").row()
            .resized();
        await ctx.reply("📋 <b>Asosiy boshqaruv menyusi</b>", { parse_mode: 'HTML', reply_markup: keyboard });
    }

    async handleAdminStart(ctx) {
        await ctx.reply(`<b>Nexus ERP SaaS</b> Admin paneliga xush kelibsiz! 👋\n\nTizimda tanilish va o'z biznesingizga ulanish uchun telefon raqamingizni yuboring:`, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [[{ text: "📞 Raqamni ulash", request_contact: true }]],
                resize_keyboard: true, one_time_keyboard: true
            }
        });
    }

    async handleAdminContact(ctx) {
        const phone = ctx.message.contact.phone_number.replace(/\D/g, '').slice(-9);
        const staff = await prisma.user.findFirst({ where: { phone: { contains: phone } }, include: { business: true } });

        if (staff) {
            await prisma.telegramUser.upsert({
                where: { telegramId: ctx.from.id.toString() },
                update: { businessId: staff.businessId, chatId: ctx.chat.id.toString(), isReportRecipient: true, phone },
                create: { telegramId: ctx.from.id.toString(), businessId: staff.businessId, chatId: ctx.chat.id.toString(), isReportRecipient: true, phone }
            });
            await ctx.reply(`✅ <b>Xush kelibsiz, ${staff.name}!</b>\nSiz <b>${staff.business?.name || 'Nexus'}</b> do'koniga admin qilib ulandingiz.`, { parse_mode: 'HTML' });
            await this.sendAdminMainMenu(ctx);
        } else {
            await ctx.reply("⚠️ Sizning raqamingiz tizimda topilmadi. Login parol orqali tizimga kirib, raqamingizni sozlashingiz kerak.");
        }
    }

    async handleAdminReportToday(ctx) {
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() }, include: { business: true } });
        if (!tUser?.businessId) return ctx.reply("Iltimos, avval /start orqali ro'yxatdan o'ting.");

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [sales, expenses] = await Promise.all([
            prisma.sale.aggregate({ where: { businessId: tUser.businessId, createdAt: { gte: today }, status: 'completed' }, _sum: { total: true }, _count: { id: true } }),
            prisma.expense.aggregate({ where: { businessId: tUser.businessId, date: { gte: today } }, _sum: { amount: true } })
        ]);

        const total = sales._sum.total || 0;
        const count = sales._count.id || 0;
        const exp = expenses._sum.amount || 0;
        const storeName = tUser.business?.settings?.storeName || tUser.business?.name;
        const currency = tUser.business?.settings?.currency || 'USD';

        let message = `📊 <b>${storeName} | Bugungi Hisobot</b>\n` +
                      `━━━━━━━━━━━━━━━\n` +
                      `🛍 Sotuvlar soni: <b>${count} ta</b>\n` +
                      `💰 Umumiy savdo: <b>${total.toLocaleString()} ${currency}</b>\n` +
                      `📉 Jami xarajat: <b>${exp.toLocaleString()} ${currency}</b>\n` +
                      `━━━━━━━━━━━━━━━\n` +
                      `💎 <b>SOF FOYDA: ${(total - exp).toLocaleString()} ${currency}</b>\n\n` +
                      `<i>Batafsil ma'lumot uchun pastdagi tugmalardan foydalaning.</i>`;

        await ctx.reply(message, { parse_mode: 'HTML' });
    }

    async handleAdminReportWeekly(ctx) {
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() }, include: { business: true } });
        if (!tUser?.businessId) return;

        const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
        const currency = tUser.business?.settings?.currency || 'USD';
        
        const sales = await prisma.sale.aggregate({
            where: { businessId: tUser.businessId, createdAt: { gte: lastWeek }, status: 'completed' },
            _sum: { total: true }
        });

        await ctx.reply(`📈 <b>Oxirgi 7 kunlik savdo:</b>\n\n💰 Jami: <b>${(sales._sum.total || 0).toLocaleString()} ${currency}</b>`, { parse_mode: 'HTML' });
    }

    async handleAdminLowStock(ctx) {
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() } });
        if (!tUser?.businessId) return;

        const products = await prisma.product.findMany({
            where: { businessId: tUser.businessId, isActive: true, stock: { lte: 10 } },
            take: 10,
            orderBy: { stock: 'asc' }
        });

        const list = products.map(p => `⚠️ ${p.name}: <b>${p.stock} ${p.unit}</b> (Min: ${p.minStock})`).join('\n');
        await ctx.reply(`📉 <b>Kam qolgan mahsulotlar:</b>\n\n${list || "Hamma mahsulotlar yetarli."}`, { parse_mode: 'HTML' });
    }

    async handleAdminTopProducts(ctx) {
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() } });
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const items = await prisma.saleItem.findMany({
            where: { sale: { businessId: tUser.businessId, createdAt: { gte: today } } },
            include: { product: true }
        });

        const grouped = items.reduce((acc, item) => {
            acc[item.product.name] = (acc[item.product.name] || 0) + item.quantity;
            return acc;
        }, {});

        const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const list = sorted.map(([name, qty]) => `• ${name}: <b>${qty} ta</b>`).join('\n');

        await ctx.reply(`🔝 <b>Bugun eng ko'p sotilgan:</b>\n\n${list || "Hali sotuv yo'q."}`, { parse_mode: 'HTML' });
    }

    async handleAdminSettingsMenu(ctx) {
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() }, include: { business: true } });
        if (!tUser?.businessId) return;
        
        const isEnabled = tUser.business?.settings?.allowReg === 'true';

        const keyboard = new InlineKeyboard()
            .text(`${isEnabled ? "✅" : "❌"} Mijozlar o'zi qo'shilishi`, `toggle_reg_${isEnabled ? 'false' : 'true'}`).row()
            .text("🏷 Do'kon nomini o'zgartirish", "set_store_name").row()
            .text("📅 Hisobot vaqti (21:00)", "set_report_time").row();

        await ctx.reply(`⚙️ <b>Tizim Sozlamalari: ${tUser.business?.name}</b>\n\nHar bir biznes mustaqil va izolatsiya qilingan.`, { parse_mode: 'HTML', reply_markup: keyboard });
    }

    async handleToggleRegistration(ctx) {
        const value = ctx.match[1];
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() } });
        const business = await prisma.business.findUnique({ where: { id: tUser.businessId } });
        const settings = business.settings || {};
        settings.allowReg = value;

        await prisma.business.update({ where: { id: business.id }, data: { settings } });
        await ctx.answerCallbackQuery(`Mijozlar registratsiyasi: ${value === 'true' ? 'YOQILDI' : 'OCHIRILDI'}`);
        await this.handleAdminSettingsMenu(ctx);
    }

    async handleAdminMessage(ctx) {
        const text = ctx.message.text;
        const cleanText = text.replace(/\D/g, '');
        
        if (cleanText.length >= 9) {
            // Mijoz qidirish (SaaS filter bilan)
            const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() } });
            const customer = await prisma.customer.findFirst({
                where: { businessId: tUser.businessId, phone: { contains: cleanText.slice(-9) } },
                include: { debts: { where: { status: 'pending' } }, sales: { take: 5, orderBy: { createdAt: 'desc' } } }
            });

            if (customer) {
                const totalDebt = customer.debts.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
                const currency = tUser.business?.settings?.currency || 'USD';
                const history = customer.sales.map(s => `• #${s.receiptNo} | ${s.total.toLocaleString()} ${currency}`).join('\n');
                await ctx.reply(`👤 <b>Mijoz: ${customer.name}</b>\n\n💰 Qarz: <b>${totalDebt.toLocaleString()} ${currency}</b>\n\n🛍 <b>Oxirgi xaridlar:</b>\n${history || 'Xarid yo\'q'}`, { parse_mode: 'HTML' });
            } else {
                await ctx.reply("❌ Bunday raqamli mijoz sizda topilmadi.");
            }
        }
    }

    // --- CLIENT BOT ---
    async initClientBot() {
        if (!this.clientBot) return;
        try {
            console.log(`✅ Klient Bot (SaaS) ishga tushdi.`);
            this.clientBot.command('start', (ctx) => this.handleClientStart(ctx));
            this.clientBot.on(':contact', (ctx) => this.handleClientContact(ctx));
            this.clientBot.on('message:text', (ctx) => this.handleClientMessage(ctx));
            this.clientBot.start({ drop_pending_updates: true });
        } catch (error) {
            console.error('❌ Client Bot Error:', error);
        }
    }

    async handleClientStart(ctx) {
        await ctx.reply(`<b>Nexus MIJOZ</b> tizimiga xush kelibsiz! 👋\n\nXaridlar va qarzni tekshirish uchun raqamingizni yuboring:`, {
            parse_mode: 'HTML',
            reply_markup: { keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true }
        });
    }

    async handleClientContact(ctx) {
        const phone = ctx.message.contact.phone_number.replace(/\D/g, '').slice(-9);
        const chatId = ctx.chat.id.toString();
        const telegramId = ctx.from.id.toString();

        // 1. Update Identity
        await prisma.telegramUser.upsert({
            where: { telegramId },
            update: { phone, chatId, step: 'READY' },
            create: { telegramId, phone, chatId, step: 'READY' }
        });

        // 2. Link to ALL matching customers across ALL businesses (SaaS Broadcast)
        const customers = await prisma.customer.updateMany({
            where: { phone: { contains: phone } },
            data: { telegramChatId: chatId }
        });

        const suppliers = await prisma.supplier.updateMany({
            where: { phone: { contains: phone } },
            data: { telegramChatId: chatId }
        });

        // 3. Greeting
        if (customers.count > 0) {
            await ctx.reply(`✅ <b>Xush kelibsiz!</b>\nSiz tizimdagi do'konlaringizga muvaffaqiyatli ulandingiz. Endi xarid cheklari sizga shu yerda keladi.`, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
        } else {
            await ctx.reply("⚠️ Raqamingiz do'konlar bazasidan topilmadi. Xarid qilayotganda raqamingizni aytsangiz, tizim avtomatik ulanadi.");
        }
    }

    async handleClientMessage(ctx) {
        const text = ctx.message.text;
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() } });
        if (text === '/history' && tUser?.customerId) {
            const customer = await prisma.customer.findUnique({ where: { id: tUser.customerId }, include: { business: true } });
            const currency = customer?.business?.settings?.currency || 'USD';
            const sales = await prisma.sale.findMany({ where: { customerId: tUser.customerId }, orderBy: { createdAt: 'desc' }, take: 5 });
            const list = sales.map(s => `🔹 #${s.receiptNo} | ${s.total.toLocaleString()} ${currency}`).join('\n');
            await ctx.reply(`🛍 <b>Sizning xaridlaringiz:</b>\n\n${list}`, { parse_mode: 'HTML' });
        }
    }

    // --- SHARED TOOLS ---
    async runTicker() {
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const businesses = await prisma.business.findMany({ where: { isActive: true } });

        for (const b of businesses) {
            const reportTime = b.settings?.reportTime || '21:00';
            if (time === reportTime) await this.sendDailySummaryToAdmins(b.id);
        }
    }

    async sendDailySummaryToAdmins(businessId) {
        if (!this.adminBot) return;
        const recipients = await prisma.telegramUser.findMany({ where: { businessId, isReportRecipient: true } });
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        const currency = business?.settings?.currency || 'USD';
        const sales = await prisma.sale.aggregate({ where: { businessId, createdAt: { gte: today }, status: 'completed' }, _sum: { total: true } });
        const msg = `📊 <b>Kunlik Hisobot (${new Date().toLocaleDateString()})</b>\n\nSavdo: ${ (sales._sum.total || 0).toLocaleString() } ${currency}`;
        for (const r of recipients) {
            await this.adminBot.api.sendMessage(r.chatId, msg, { parse_mode: 'HTML' }).catch(err => console.error('Admin summary send error:', err));
        }
    }

    async sendClientSaleNotification(saleId) {
        if (!this.clientBot) return;
        try {
            const sale = await prisma.sale.findUnique({
                where: { id: saleId },
                include: { customer: { include: { business: true } }, items: { include: { product: true } }, cashier: true }
            });
            if (!sale || !sale.customer?.telegramChatId) return;

            const allDebts = await prisma.debt.findMany({ where: { customerId: sale.customerId, status: 'pending' } });
            const totalDebtAfter = allDebts.reduce((s, d) => s + (d.amount - d.paidAmount), 0);
            const totalDebtBefore = totalDebtAfter - sale.debtAmount;

            const pdfBuffer = await pdfService.generateSaleReceipt(sale, sale.items, { totalDebtBefore, totalDebtAfter });
            
            const storeName = sale.customer.business?.settings?.storeName || sale.customer.business?.name || "MIJOZ";
            const currency = sale.customer.business?.settings?.currency || 'USD';
            const message = `✅ <b>Sotuv tasdiqlandi</b>\n\n👤 <b>Mijoz:</b> ${sale.customer.name}\n🕑 <b>Sana:</b> ${new Date().toLocaleString()}\n🏪 <b>Do'kon:</b> ${storeName}\n💵 <b>Summa:</b> <b>${sale.total.toLocaleString()} ${currency}</b>`;

            await this.clientBot.api.sendDocument(sale.customer.telegramChatId, pdfBuffer, {
                caption: message, parse_mode: 'HTML'
            }, { filename: `Receipt_${sale.receiptNo}.pdf`, contentType: 'application/pdf' });
        } catch (error) {
            console.error('sendClientSaleNotification error:', error);
        }
    }

    async sendAdminSaleNotification(saleId) {
        if (!this.adminBot) return;
        try {
            const sale = await prisma.sale.findUnique({
                where: { id: saleId },
                include: { items: { include: { product: true } }, cashier: true, business: true, customer: true }
            });
            if (!sale) return;

            const recipients = await prisma.telegramUser.findMany({ 
                where: { businessId: sale.businessId, isReportRecipient: true } 
            });

            if (recipients.length === 0) return;

            // Format items list (Max 3 items as per user request)
            const itemLines = sale.items.slice(0, 3).map(i => `▫️ ${i.product.name} x ${i.quantity} ${i.product.unit}`);
            if (sale.items.length > 3) itemLines.push(`▫️ <i>va yana ${sale.items.length - 3} ta mahsulot...</i>`);
            
            const paymentMap = { 'cash': '💵 Naqd', 'card': '💳 Karta', 'bank': '🏦 Bank', 'debt': '📌 Qarz', 'mixed': '🔄 Aralash' };
            const currency = sale.business?.settings?.currency || 'USD';
            
            const message = `🛍 <b>Yangi Sotuv!</b>\n` +
                          `━━━━━━━━━━━━━━━\n` +
                          `🧾 Chek: <b>#${sale.receiptNo}</b>\n` +
                          `👤 Sotuvchi: <b>${sale.cashier.name}</b>\n` +
                          `👥 Mijoz: <b>${sale.customer?.name || 'Umumiy'}</b>\n\n` +
                          `📦 <b>Mahsulotlar:</b>\n${itemLines.join('\n')}\n\n` +
                          `💰 <b>Jami: ${sale.total.toLocaleString()} ${currency}</b>\n` +
                          `💳 To'lov: <b>${paymentMap[sale.paymentMethod] || sale.paymentMethod}</b>\n` +
                          `━━━━━━━━━━━━━━━\n` +
                          `📅 ${new Date().toLocaleString('uz-UZ')}`;

            for (const r of recipients) {
                await this.adminBot.api.sendMessage(r.chatId, message, { parse_mode: 'HTML' }).catch(() => null);
            }
        } catch (error) {
            console.error('sendAdminSaleNotification error:', error);
        }
    }

    async handleAdminBalance(ctx) {
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() } });
        if (!tUser?.businessId) return;

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const sales = await prisma.sale.findMany({ 
            where: { businessId: tUser.businessId, createdAt: { gte: today }, status: 'completed' } 
        });

        const stats = sales.reduce((acc, s) => {
            acc.cash += s.cashAmount;
            acc.card += s.cardAmount;
            acc.bank += s.bankAmount;
            acc.debt += s.debtAmount;
            acc.total += s.total;
            return acc;
        }, { cash: 0, card: 0, bank: 0, debt: 0, total: 0 });

        const currency = tUser.business?.settings?.currency || 'USD';

        const message = `💰 <b>Bugungi Kassa (Balans):</b>\n` +
                      `━━━━━━━━━━━━━━━\n` +
                      `💵 Naqd: <b>${stats.cash.toLocaleString()} ${currency}</b>\n` +
                      `💳 Karta: <b>${stats.card.toLocaleString()} ${currency}</b>\n` +
                      `🏦 Bank:  <b>${stats.bank.toLocaleString()} ${currency}</b>\n` +
                      `📌 Qarz:  <b>${stats.debt.toLocaleString()} ${currency}</b>\n` +
                      `━━━━━━━━━━━━━━━\n` +
                      `💎 <b>JAMI: ${stats.total.toLocaleString()} ${currency}</b>`;

        await ctx.reply(message, { parse_mode: 'HTML' });
    }

    async handleAdminExpensesDetails(ctx) {
        const tUser = await prisma.telegramUser.findUnique({ where: { telegramId: ctx.from.id.toString() } });
        if (!tUser?.businessId) return;

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const expenses = await prisma.expense.findMany({ 
            where: { businessId: tUser.businessId, date: { gte: today } },
            orderBy: { createdAt: 'desc' }
        });

        if (expenses.length === 0) return ctx.reply("💸 Bugun hali xarajat qilinmadi.");

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const currency = tUser.business?.settings?.currency || 'USD';
        const list = expenses.map(e => `🔸 ${e.category}: <b>${e.amount.toLocaleString()}</b>\n   <pre>${e.description || '-'}</pre>`).join('\n');

        const message = `💸 <b>Bugungi Xarajatlar:</b>\n\n${list}\n\n📉 <b>Jami: ${total.toLocaleString()} ${currency}</b>`;
        await ctx.reply(message, { parse_mode: 'HTML' });
    }
}

module.exports = new BotService();
