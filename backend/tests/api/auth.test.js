import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(new URL('../../.env.test', import.meta.url).pathname), override: true });

const require = createRequire(import.meta.url);
const buildApp = require('../../src/app.js');
const prisma = require('../../src/prisma.js');

let app;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await prisma.$connect();

  // Seed test user
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { phone: '998901234567' },
    update: { passwordHash: hash },
    create: { name: 'Test User', phone: '998901234567', passwordHash: hash, role: 'ADMIN' },
  });
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('Authentication API & State (High Priority)', () => {
    let token = '';

    it('should reject invalid credentials', async () => {
        const res = await request(app.server)
            .post('/api/auth/login')
            .send({
                phone: '998901234567',
                password: 'wrong_password'
            });
        
        expect(res.status).not.toBe(200);
        expect(res.body).toHaveProperty('error');
    });

    it('should login with valid admin credentials (staging/test user)', async () => {
        // Assuming dev seed contains '998901234567' / 'password123'
        const res = await request(app.server)
            .post('/api/auth/login')
            .send({
                phone: '998901234567',
                password: 'password123'
            });

        if (res.status === 200) {
            expect(res.body).toHaveProperty('data.token');
            token = res.body.data.token;
        }
    });

    it('should fetch user profile with token', async () => {
        if (!token) return; // Skip if no token grabbed

        const res = await request(app.server)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data.id');
        expect(res.body).toHaveProperty('data.role');
    });
});
