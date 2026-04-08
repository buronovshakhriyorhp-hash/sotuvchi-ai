# Nexus ERP - High Priority Manual QA Test Cases

Loyiha bo'yicha eng muhim modullar (POS va Hisobotlar) uchun manual testlar ro'yxati. Moliya va xislbolar xatoni kechirmaydi, shuning uchun bu qismga alohida ahamiyat qaratildi.

## 1. POS (Point of Sale) Moduli Tizimi

| Test ID | Ssenariy Tavsifi | Kutilayotgan Natija | Holat |
|---------|------------------|---------------------|-------|
| POS-01 | **Savatga tovar qo'shish va hisoblash**<br>Bitta va bir nechta tovarlarni savatga qo'shganda jami summa to'g'ri hisoblanishini tekshirish. (USD va UZS valyuta kurslari inobatga olingan holda) | Barcha qo'shilgan tovarlar tannarxi aniq yig'ilishi va chegirmalarsiz haqiqiy summa chiqishi kerak. | ⬜ Ochiq |
| POS-02 | **To'lov qilish (Naqd pul va Plastik aralash)**<br>To'lov oynasida mijoz ham naqd pul, ham plastik karta orqali aralash to'lov qilganda balans to'g'ri ishlashi. | Tizim kiritilgan summalarni "Jami To'lov" ga tengligini validatsiya qilishi va muvaffaqiyatli tranzaksiyadan so'ng POS tozalanib yangi chek ochilishi kerak. | ⬜ Ochiq |
| POS-03 | **Chegirma qo'llash (Foiz va Naqd)**<br>Tovar jami summasiga 10% yoki ma'lum naqd pul miqdorida chegirma qo'llash. | "Total" chegirma ayirilgandan so'ng yangilanishi va ma'lumotlar bazasida (Sale modeli) discountAmt va subtotal aniq yozilishi kerak. | ⬜ Ochiq |
| POS-04 | **Qarzga sotish (Debt)**<br>Tanlangan mijozga qisman yoki to'liq qarzga tovar sotish. | "Payment method: debt" sifatida qayd etilishi, "Debt" (Qarz) jadvalida miqdor, muddati va customer_id paydo bo'lishi kerak. | ⬜ Ochiq |
| POS-05 | **Tarmoq etishmovchiligida Offline himoya**<br>To'lov tugmasini bosishdan oldin internet uzilganda nima bo'ladi? | Tizim xatolik haqida tushunarli Toast xabari (Global alert) chiqarishi va xodim pulni ikki marta ishlab yuborishidan saqlab, tugmani block(disabled) qilishi kerak. | ⬜ Ochiq |

---

## 2. Hisobotlar va Moliya Moduli

| Test ID | Ssenariy Tavsifi | Kutilayotgan Natija | Holat |
|---------|------------------|---------------------|-------|
| REP-01 | **Kunlik Kassa (Shift / Z-Report)**<br>Kun davomida qilingan barcha savdolar, chiqimlar (Expense) va qaytim pulini jamlash. | Kassada mavjud naqd pul, terminal tushumlari hisobotdagi "Kutilayotgan Kassa" balansiga mutlaq mos kelishi shart. | ⬜ Ochiq |
| REP-02 | **Sof Foydani Hisoblash (Net Profit)**<br>Sof foyda = (Sotilgan mahsulotlar * Sotuv narxi) - (Sotilgan mahsulotlar * Tannarxi) - Xarajatlar (Expense). | Foyda hisoboti faqat sotilgan (shakllangan) tovarlar tannarxini hisobga olib aniq raqam qaytarishi kerak. | ⬜ Ochiq |
| REP-03 | **Qarzdorlik Hisoboti**<br>Customer va Supplier qarzlari ro'yxatini va ularni to'lash muddatlarini ko'rish. | Overdue (muddati o'tgan) qarzlar qizil rangda, qisman to'langanlar aniq ko'rsatilishi kerak. | ⬜ Ochiq |
| REP-04 | **Telegram Bot Integratsiyasi orqali Hisobot**<br>Kun oxirida Rahbariyat guruhiga ishlash haqida xabar kelishi. | Z-Report bosilganda yoki avtomatik belgilangan vaqtda bot jami savdo summasi, sof foyda va qoldiqlarni tushunarli formatda guruhga yuborishi lozim. | ⬜ Ochiq |

---

## 3. Rol va Ruxsatlar Tizimi (RBAC)

| Test ID | Ssenariy Tavsifi | Kutilayotgan Natija | Holat |
|---------|------------------|---------------------|-------|
| SEC-01 | **Kassir (CASHIER) chegaralari**<br>Kassir accounti orqali kirib Settings yoki Foyda/Zarar hisobotini ko'rishga urinish. | Bu qismlar UI'da yashiringan bo'lishi va agar URL to'g'ridan-to'g'ri yozilsa (masalan `/reports/profit`), 403 Forbidden Access sahifasi yoki yo'naltirish (Redirect) bo'lishi kerak. | ⬜ Ochiq |
| SEC-02 | **Xarajatlar (Expense) kiritish validatsiyasi**<br>Admin yoki Kassir tomonidan noto'g'ri / salbiy (-) miqdorda xarajat yozilishi. | Tizim salbiy son qabul qilmasligi va majburiy description maydonini so'rashi kerak. | ⬜ Ochiq |

> [!CAUTION]
> Moliyaviy tranzaksiyalarni (SaleItem va Debt) o'chirish (Delete) qoldiqni tiklashsiz amalga oshinmasligi lozim. AuditLog har doim yozilishi shart.
