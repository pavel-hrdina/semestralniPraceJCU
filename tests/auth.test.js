jest.mock('firebase-admin');

const request = require('supertest');
const admin = require('firebase-admin');
const { app, resetState } = require('../server');

beforeEach(() => {
    admin.__reset();
    resetState();
});

describe('Autentizace', () => {
    test('login se správnými údaji vrátí token', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ username: 'admin', password: 'admin123' });

        expect(res.status).toBe(200);
        expect(typeof res.body.token).toBe('string');
        expect(res.body.token.length).toBeGreaterThan(20);
    });

    test('login se špatným heslem vrátí 401', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ username: 'admin', password: 'spatne' });

        expect(res.status).toBe(401);
    });

    test('admin endpoint bez tokenu vrátí 401', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({ name: 'Test', price: 100, description: 'Popis' });

        expect(res.status).toBe(401);
    });

    test('admin endpoint s neplatným tokenem vrátí 401', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', 'falesny-token')
            .send({ name: 'Test', price: 100, description: 'Popis' });

        expect(res.status).toBe(401);
    });

    test('logout zneplatní token', async () => {
        const login = await request(app)
            .post('/api/login')
            .send({ username: 'admin', password: 'admin123' });
        const token = login.body.token;

        await request(app)
            .post('/api/logout')
            .set('Authorization', token);

        const res = await request(app)
            .post('/api/products')
            .set('Authorization', token)
            .send({ name: 'Test', price: 100, description: 'Popis' });

        expect(res.status).toBe(401);
    });
});
