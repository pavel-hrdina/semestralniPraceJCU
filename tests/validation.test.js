jest.mock('firebase-admin');

const request = require('supertest');
const admin = require('firebase-admin');
const { app, resetState } = require('../server');

let token;

beforeEach(async () => {
    admin.__reset();
    resetState();
    const login = await request(app)
        .post('/api/login')
        .send({ username: 'admin', password: 'admin123' });
    token = login.body.token;
});

describe('Validace produktu', () => {
    test('odmítne prázdný název', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', token)
            .send({ name: '', price: 100, description: 'Popis' });

        expect(res.status).toBe(400);
    });

    test('odmítne zápornou cenu', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', token)
            .send({ name: 'Test', price: -50, description: 'Popis' });

        expect(res.status).toBe(400);
    });

    test('odmítne cenu jako string', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', token)
            .send({ name: 'Test', price: '100', description: 'Popis' });

        expect(res.status).toBe(400);
    });

    test('odmítne příliš dlouhý popis', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', token)
            .send({ name: 'Test', price: 100, description: 'x'.repeat(1001) });

        expect(res.status).toBe(400);
    });

    test('odmítne neplatný formát obrázku', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', token)
            .send({
                name: 'Test',
                price: 100,
                description: 'Popis',
                image: 'http://example.com/image.jpg'
            });

        expect(res.status).toBe(400);
    });

    test('přijme platná data včetně obrázku', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', token)
            .send({
                name: 'Hrnek',
                price: 250,
                description: 'Bílý keramický hrnek',
                image: 'data:image/jpeg;base64,xxx'
            });

        expect(res.status).toBe(201);
    });
});
