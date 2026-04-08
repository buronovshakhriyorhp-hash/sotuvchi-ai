/* eslint-disable no-unused-vars */
const { Bot } = require('grammy');
const prisma = require('../prisma');

class BotService {
    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        if (!this.token) {
            console.error('TELEGRAM_BOT_TOKEN topilmadi!');
            return;
        }

        // Initialize bot
        this.bot = new Bot(this.token);
        this.username = '';
        this.init();
    }

    async init() {
        try {
            const botInfo = await this.bot.api.getMe();
            this.username = botInfo.username;
            console.log(`Telegram Bot ishga tushdi: @${this.username}`);

            // Handlers
            this.bot.command('start', (ctx) => this.handleStart(ctx));
            this.bot.command('report', (ctx) => this.handleReport(ctx));
            this.bot.hears(/^\/expense (.+)/, (ctx) => this.handleExpense(ctx));
            this.bot.on('message', (ctx) => this.handleMessage(ctx));
            this.bot.on('contact', (ctx) => this.handleContact(ctx));
            
            // Error handling
            this.bot.catch((err) => {
                console.error('Bot Error:', err);
            });

            // Start bot
            this.bot.start();
        } catch (error) {
            console.error('Bot init error:', error.message);
        }
    }

    async handleStart(ctx) {
        const chatId = ctx.chat.id;
        const telegramId = ctx.from.id.toString();

        try {
            let user = await prisma.telegramUser.findUnique({ where: { telegramId } });

            if (!user) {
                user = await prisma.telegramUser.create({
                    data: {
                        telegramId,
                        firstName: ctx.from.first_name,
                        lastName: ctx.from.last_name,
                        username: ctx.from.username,
                        chatId: chatId.toString(),
                        step: 'WAITING_NAME'
                    }
                });
            } else {
                await prisma.telegramUser.update({
                    where: { telegramId },
                    data: { step: 'WAITING_NAME' }
                });
            }

            await ctx.reply(
                `Assalomu alaykum, <b>${ctx.from.first_name}</b>! \n\n` +
                `<b>Nexus ERP</b> tizimi botiga xush kelibsiz. \n\n` +
                `Ro'yxatdan o'tishni boshlash uchun iltimos, <b>ismingizni</b> kiriting:`, 
                { parse_mode: 'HTML' }
            );
        } catch (error) {
            console.error('handleStart error:', error);
        }
    }

    async handleMessage(ctx) {
        const msg = ctx.message;
        if (!msg.text || msg.text.startsWith('/') || msg.contact) return;

        const telegramId = ctx.from.id.toString();
        const chatId = ctx.chat.id;

        try {
            const user = await prisma.telegramUser.findUnique({ where: { telegramId } });
            if (!user) return;

            if (user.step === 'WAITING_NAME') {
                const fullName = msg.text.trim();
                await prisma.telegramUser.update({
                    where: { telegramId },
                    data: {
                        firstName: fullName,
                        step: 'WAITING_PHONE'
                    }
                });

                await ctx.reply(
                    `Rahmat, <b>${fullName}</b>! \n\n` +
                    `Endi esa, pastdagi tugmani bosish orqali <b>telefon raqamingizni</b> yuboring:`, 
                    { 
                        parse_mode: 'HTML',
                        reply_markup: {
                            keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    }
                );
            }
        } catch (error) {
            console.error('handleMessage error:', error);
        }
    }

    async handleContact(ctx) {
        const msg = ctx.message;
        if (!msg.contact) return;

        const telegramId = ctx.from.id.toString();
        const chatId = ctx.chat.id;
        let phone = msg.contact.phone_number;
        if (!phone.startsWith('+')) phone = '+' + phone;

        try {
            const user = await prisma.telegramUser.findUnique({ where: { telegramId } });
            if (!user) return;

            // Normalize phone
            let cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.startsWith('998')) cleanPhone = cleanPhone.slice(3);

            // 1. Dastlab xodimlar (User) jadvalidan qidiramiz
            const staff = await prisma.user.findFirst({
                where: { phone: { contains: cleanPhone } }
            });

            if (staff) {
                await prisma.telegramUser.update({
                    where: { telegramId },
                    data: { phone, step: 'REGISTERED_STAFF' }
                });

                return await ctx.reply(
                    `✅ <b>Xodim sifatida tanildingiz!</b> \n\n` +
                    `Ism: <b>${staff.name}</b> \n` +
                    `Lavozim: <b>${staff.role}</b> \n\n` +
                    `Endi siz quyidagi buyruqlardan foydalanishingiz mumkin: \n` +
                    `/report - Kunlik hisobot \n` +
                    `/expense [summa] [toifa] [izoh] - Xarajat kiritish (USD)`, 
                    { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
                );
            }

            // 2. Aks holda mijoz sifatida davom etamiz
            const customers = await prisma.customer.findMany({
                where: {
                    OR: [
                        { phone: { contains: cleanPhone.slice(-9) } },
                        { phone: { contains: cleanPhone } }
                    ]
                }
            });

            let customerId = null;
            if (customers.length > 0) {
                customerId = customers[0].id;
                await prisma.customer.update({
                    where: { id: customerId },
                    data: { phone }
                });
            } else {
                const newCustomer = await prisma.customer.create({
                    data: { name: user.firstName, phone: phone, type: 'individual' }
                });
                customerId = newCustomer.id;
            }

            await prisma.telegramUser.update({
                where: { telegramId },
                data: { phone: phone, customerId: customerId, step: 'REGISTERED' }
            });

            await ctx.reply(
                `<b>Tabriklaymiz!</b> \n\n` +
                `Siz mijoz sifatida muvaffaqiyatli ro'yxatdan o'tdingiz.`, 
                { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
            );

        } catch (error) {
            console.error('handleContact error:', error);
            await ctx.reply("Xatolik yuz berdi.");
        }
    }

    async handleReport(ctx) {
        const chatId = ctx.chat.id;
        const telegramId = ctx.from.id.toString();

        try {
            const tUser = await prisma.telegramUser.findUnique({ where: { telegramId } });
            if (!tUser || tUser.step !== 'REGISTERED_STAFF') {
                return ctx.reply("Bu buyruq faqat xodimlar uchun.");
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [sales, expenses, activeDebts] = await Promise.all([
                prisma.sale.aggregate({
                    where: { createdAt: { gte: today }, status: 'completed' },
                    _sum: { total: true },
                    _count: { id: true }
                }),
                prisma.expense.aggregate({
                    where: { date: { gte: today } },
                    _sum: { amount: true }
                }),
                prisma.debt.aggregate({
                    where: { status: { in: ['pending', 'partial'] } },
                    _sum: { amount: true, paidAmount: true }
                })
            ]);

            const totalSales = sales._sum.total || 0;
            const totalExpenses = expenses._sum.amount || 0;
            const netProfitToday = totalSales - totalExpenses; // Soddalashtirilgan hisob
            const totalDebt = (activeDebts._sum.amount || 0) - (activeDebts._sum.paidAmount || 0);

            let report = 
                `📊 <b>Kunlik Hisobot (${today.toLocaleDateString()})</b> \n\n` +
                `💰 <b>Umumiy Savdo:</b> ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD (${sales._count.id} ta) \n` +
                `💸 <b>Xarajatlar:</b> ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD \n` +
                `📈 <b>Sof Foyda:</b> ${netProfitToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD \n\n` +
                `🔴 <b>Umumiy Qarzlar (Hozirgi):</b> ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

            await ctx.reply(report, { parse_mode: 'HTML' });
        } catch (error) {
            console.error('handleReport error:', error);
        }
    }

    async handleExpense(ctx) {
        const chatId = ctx.chat.id;
        const telegramId = ctx.from.id.toString();
        
        try {
            const tUser = await prisma.telegramUser.findUnique({ where: { telegramId } });
            if (!tUser || tUser.step !== 'REGISTERED_STAFF') return;

            const input = ctx.match[1].split(' ');
            if (input.length < 2) {
                return ctx.reply("Format xato. Misol: <code>/expense 50000 Obed choy</code>", { parse_mode: 'HTML' });
            }

            const amount = parseFloat(input[0]);
            const category = input[1];
            const description = input.slice(2).join(' ') || '';

            if (isNaN(amount)) return ctx.reply("Summa raqam bo'lishi kerak.");

            const staff = await prisma.user.findFirst({ where: { phone: { contains: tUser.phone.replace(/\D/g, '').slice(-9) } } });

            await prisma.expense.create({
                data: {
                    amount,
                    category,
                    description: `(Bot orqali) ${description}`,
                    userId: staff.id,
                    date: new Date()
                }
            });

            await ctx.reply(`✅ <b>Xarajat saqlandi!</b> \n\nSumma: ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD \nToifa: ${category}`, { parse_mode: 'HTML' });
        } catch (error) {
            console.error('handleExpense error:', error);
        }
    }

    async sendSaleNotification(saleId) {
        try {
            const sale = await prisma.sale.findUnique({
                where: { id: saleId },
                include: {
                    customer: { include: { telegramUser: true, debts: true } },
                    items: { include: { product: true } },
                    cashier: true
                }
            });

            if (!sale || !sale.customer || !sale.customer.telegramUser) return;

            const tUser = sale.customer.telegramUser;
            
            // Warehouse name aniqlash
            const tx = await prisma.warehouseTx.findFirst({
                where: { reason: { contains: sale.receiptNo } },
                include: { warehouse: true }
            });
            const warehouseName = tx?.warehouse?.name || 'Главный склад';
            sale.warehouseName = warehouseName;

            // Qarz ma'lumotlarini hisoblash
            const allDebts = await prisma.debt.findMany({
                where: { customerId: sale.customerId, status: { in: ['pending', 'partial'] } }
            });
            const totalDebtAfter = allDebts.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
            const totalDebtBefore = totalDebtAfter - sale.debtAmount;

            const debtInfo = { totalDebtBefore, totalDebtAfter };

            const pdfService = require('./pdf.service');
            const pdfBuffer = await pdfService.generateSaleReceipt(sale, sale.items, debtInfo);

            const dateStr = new Date(sale.createdAt).toLocaleDateString('ru-RU');
            
            let message = 
                `✅ <b>Продажа подтверждена</b> \n\n` +
                `🤵 <b>Контрагент:</b> ${sale.customer.name} \n` +
                `🕑 <b>Дата:</b> ${dateStr} \n` +
                `🏪 <b>Магазин:</b> ${warehouseName} \n` +
                `💰 <b>Касса:</b> ${sale.cashier.name} \n` +
                `💵 <b>Итоговые суммы:</b> ${sale.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD \n`;

            if (totalDebtAfter > 0) {
                message += `\n🔴 <b>Итого долг:</b> ${totalDebtAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
            }

            await this.bot.api.sendDocument(tUser.chatId, pdfBuffer, {
                caption: message,
                parse_mode: 'HTML'
            }, {
                filename: `${sale.customer.name}.pdf`,
                contentType: 'application/pdf'
            });

        } catch (error) {
            console.error('sendSaleNotification error:', error);
        }
    }
}

module.exports = new BotService();
