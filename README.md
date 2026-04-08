# Nexus ERP - Sotuv Tizimi

Bu loyiha fullstack ERP tizimi bo'lib, savdo, ombor, mijozlar va moliya boshqaruvini ta'minlaydi. Backend Fastify + Prisma, frontend React + Vite bilan ishlab chiqilgan.

## O'rnatish

1. Repository ni clone qiling.
2. Backend va frontend uchun dependencies o'rnating:
   ```bash
   npm run install:all
   ```
3. Environment fayllarini sozlang (backend/.env va frontend/.env).
4. Database ni sozlang va seed qiling:
   ```bash
   cd backend
   npx prisma db push
   npm run db:seed
   ```

## Ishga tushirish

Development:
```bash
npm run dev
```

Production build:
```bash
npm run build
```

## Xavfsizlik

- JWT autentifikatsiya
- Rate limiting
- Helmet va CORS
- Bcrypt parol hashing

## Testlar

Backend: `npm run test`
Frontend: `npm run test:e2e`

## Deployment

Docker yoki cloud platformalarda ishga tushirish uchun environment variables ni to'g'ri sozlang.
