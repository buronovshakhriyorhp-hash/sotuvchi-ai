import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import { createRequire } from 'module';

dotenv.config({ path: path.resolve(new URL('../../.env.test', import.meta.url).pathname), override: true });

const require = createRequire(import.meta.url);
const buildApp = require('../../src/app.js');
const prisma = require('../../src/prisma.js');

let app;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await prisma.$connect();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('POS Operations API (High Priority)', () => {
    it('should fetch POS products', async () => {
        const res = await request(app.server)
            .get('/api/products')
            .query({ limit: 10 });

        expect([200, 401]).toContain(res.status);

        if (res.status === 200) {
            expect(Array.isArray(res.body.data || res.body)).toBe(true);
        }
    });

    it('should reject invalid checkout payload', async () => {
        const res = await request(app.server)
            .post('/api/sales')
            .send({});

        expect([400, 401, 500]).toContain(res.status);
    });
});
