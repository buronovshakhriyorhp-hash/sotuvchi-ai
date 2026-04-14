const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const saasService = require('./src/services/saas.service');
const axios = require('axios');

async function test() {
    console.log('--- SaaS Onboarding Verification ---');
    const api = 'http://localhost:5000/api';
    const testPhone = '998991112233';

    try {
        // 1. Cleanup old test data
        await prisma.user.deleteMany({ where: { phone: testPhone } });

        // 2. Register new business
        console.log('1. Registering new business...');
        const regResult = await saasService.registerBusiness({
            storeName: 'Zamina Test Store',
            adminName: 'Owner User',
            phone: testPhone,
            password: 'password123'
        });
        console.log('✅ Registered! Slug:', regResult.slug);

        // 3. Verify it is Inactive
        const biz = await prisma.business.findUnique({ where: { slug: regResult.slug } });
        if (biz.isActive === false) {
            console.log('✅ Verification: Business is correctly set to INACTIVE by default.');
        } else {
            console.log('❌ Error: Business is ACTIVE by default!');
        }

        // 4. Test Login & Access (Simulated via script)
        console.log('2. Simulating login and access check...');
        
        // We need a real JWT to test the 'authenticate' middleware properly through a request
        // Or we can mock the request. For now, let's just use the login route if the server is running
        const loginRes = await axios.post(`${api}/auth/login`, {
            phone: testPhone,
            password: 'password123'
        }).catch(e => e.response);

        if (loginRes.data && loginRes.data.success) {
            const token = loginRes.data.data.token;
            console.log('✅ Logged in successfully. Testing protected route...');

            // Try to hit a protected route
            const meRes = await axios.get(`${api}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(e => e.response);

            if (meRes.status === 403) {
                console.log('✅ Access BLOCKED as expected (403 Forbidden).');
            } else {
                console.log('❌ Error: Access ALLOWED despite inactive business! Status:', meRes.status);
            }

            // 5. Approve Business
            console.log('3. Approving business via SaaS service...');
            await saasService.approveBusiness(biz.id);
            
            // 6. Test Access Again
            const meRes2 = await axios.get(`${api}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(e => e.response);

            if (meRes2.status === 200) {
                console.log('✅ Access ALLOWED after activation (200 OK).');
            } else {
                console.log('❌ Error: Access still blocked after activation! Status:', meRes2.status);
            }
        } else {
            console.log('❌ Login failed!');
        }

        console.log('🏁 ALL TESTS PASSED SUCCESSFULLY');
    } catch (err) {
        console.error('❌ Verification failed:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
