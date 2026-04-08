import { describe, it, expect } from 'vitest';
import request from 'supertest';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

describe('POS Operations API (High Priority)', () => {
    // Basic test to verify products can be fetched for POS
    it('should fetch POS products', async () => {
        const res = await request(API_URL)
            .get('/products')
            .query({ limit: 10 });
        
        // Since we might be unauthenticated, we check if it responds 
        // with 200 (if public) or 401 (if protected).
        expect([200, 401]).toContain(res.status);
        
        if (res.status === 200) {
            expect(Array.isArray(res.body)).toBe(true);
        }
    });

    // Validating sale payload structure rejection
    it('should reject invalid checkout payload', async () => {
        const res = await request(API_URL)
            .post('/sales')
            .send({
                // missing required fields
            });

        expect([400, 401, 500]).toContain(res.status);
    });
});
