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

describe('CRUD produktů', () => {
    test('GET vrátí prázdné pole když žádné produkty nejsou', async () => {
        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('POST vytvoří produkt a GET ho najde', async () => {
        const created = await createProduct({
            name: 'Hrnek',
            price: 250,
            description: 'Bílý hrnek'
        });

        expect(created.id).toBeDefined();

        const list = await request(app).get('/api/products');
        expect(list.body).toHaveLength(1);
        expect(list.body[0]).toMatchObject({
            id: created.id,
            name: 'Hrnek',
            price: 250
        });
    });

    test('PUT aktualizuje existující produkt', async () => {
        const created = await createProduct({
            name: 'Hrnek',
            price: 250,
            description: 'Původní'
        });

        const res = await request(app)
            .put(`/api/products/${created.id}`)
            .set('Authorization', token)
            .send({
                name: 'Upravený hrnek',
                price: 300,
                description: 'Nový popis'
            });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Upravený hrnek');
        expect(res.body.price).toBe(300);
    });

    test('DELETE odstraní produkt', async () => {
        const created = await createProduct({
            name: 'Hrnek',
            price: 250,
            description: 'Popis'
        });

        const del = await request(app)
            .delete(`/api/products/${created.id}`)
            .set('Authorization', token);
        expect(del.status).toBe(200);

        const list = await request(app).get('/api/products');
        expect(list.body).toHaveLength(0);
    });

    test('GET na neexistující produkt vrátí 404', async () => {
        const res = await request(app).get('/api/products/neexistuje');

        expect(res.status).toBe(404);
    });
});
