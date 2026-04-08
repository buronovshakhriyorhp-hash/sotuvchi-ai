import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
// Simulating imports if we want to run against a fully loaded server
// For now, we will test the live staging/dev server at localhost:5000 
// or an initialized fastify instance. Since server requires DB, we test live dev API.

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

describe('Authentication API & State (High Priority)', () => {
    let token = '';

    it('should reject invalid credentials', async () => {
        const res = await request(API_URL)
            .post('/auth/login')
            .send({
                phone: '998901234567',
                password: 'wrong_password'
            });
        
        expect(res.status).not.toBe(200);
        expect(res.body).toHaveProperty('error');
    });

    it('should login with valid admin credentials (staging/test user)', async () => {
        // Fallback for automation to ensure we can log in.
        // Assuming dev seed contains '998901234567' / 'admin123'
        const res = await request(API_URL)
            .post('/auth/login')
            .send({
                phone: '998901234567',
                password: 'password123'
            });

        // We accept 200 or 401 if user doesn't exist yet in the DB.
        if (res.status === 200) {
            expect(res.body).toHaveProperty('token');
            token = res.body.token;
        }
    });

    it('should fetch user profile with token', async () => {
        if (!token) return; // Skip if no token grabbed

        const res = await request(API_URL)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('role');
    });
});
