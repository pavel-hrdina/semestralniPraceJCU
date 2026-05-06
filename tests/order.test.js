jest.mock('firebase-admin');

const request = require('supertest');
const admin = require('firebase-admin');
const { app, resetState } = require('../server');

let token;

async function createProduct(data) {
    const res = await request(app)
        .post('/api/products')
        .set('Authorization', token)
        .send(data);
    return res.body;
}

beforeEach(async () => {
    admin.__reset();
    resetState();
    const login = await request(app)
        .post('/api/login')
        .send({ username: 'admin', password: 'admin123' });
    token = login.body.token;
});

describe('Objednávka', () => {
    test('platná objednávka smaže produkty z databáze', async () => {
        const a = await createProduct({ name: 'A', price: 100, description: 'a' });
        const b = await createProduct({ name: 'B', price: 200, description: 'b' });

        const res = await request(app)
            .post('/api/order')
            .send({ cart: { [a.id]: 1, [b.id]: 2 } });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const list = await request(app).get('/api/products');
        expect(list.body).toHaveLength(0);
    });

    test('prázdný košík vrátí 400', async () => {
        const res = await request(app)
            .post('/api/order')
            .send({ cart: {} });

        expect(res.status).toBe(400);
    });

    test('chybějící pole cart vrátí 400', async () => {
        const res = await request(app)
            .post('/api/order')
            .send({});

        expect(res.status).toBe(400);
    });

    test('záporné množství vrátí 400', async () => {
        const product = await createProduct({ name: 'A', price: 100, description: 'a' });

        const res = await request(app)
            .post('/api/order')
            .send({ cart: { [product.id]: -1 } });

        expect(res.status).toBe(400);
    });

    test('neexistující produkt vrátí 409 a nesmaže nic', async () => {
        const product = await createProduct({ name: 'A', price: 100, description: 'a' });

        const res = await request(app)
            .post('/api/order')
            .send({ cart: { [product.id]: 1, 'neexistuje': 1 } });

        expect(res.status).toBe(409);
        expect(res.body.missingIds).toContain('neexistuje');

        const list = await request(app).get('/api/products');
        expect(list.body).toHaveLength(1);
    });
});
