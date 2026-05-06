const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('./firebase-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const productsCollection = db.collection('products');

const app = express();
const PORT = 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOKEN_TTL = 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_IMAGE_LENGTH = 800 * 1024;
const MAX_ORDER_ATTEMPTS = 3;
const ORDER_WINDOW_MS = 60 * 1000;
const MAX_CART_ITEMS = 50;
const MAX_QUANTITY_PER_ITEM = 100;

const activeTokens = new Map();
const loginAttempts = new Map();
const orderAttempts = new Map();

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

function validateProduct(body) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.length > 100) {
        return 'Neplatný název';
    }
    if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0) {
        return 'Neplatná cena';
    }
    if (typeof body.description !== 'string' || body.description.length > 1000) {
        return 'Neplatný popis';
    }
    if (body.image !== undefined && body.image !== '') {
        if (typeof body.image !== 'string' || !body.image.startsWith('data:image/')) {
            return 'Neplatný obrázek';
        }
        if (body.image.length > MAX_IMAGE_LENGTH) {
            return 'Obrázek je příliš velký (max 600 KB)';
        }
    }
    return null;
}

function validateCart(cart) {
    if (!cart || typeof cart !== 'object' || Array.isArray(cart)) {
        return 'Neplatný košík';
    }
    const ids = Object.keys(cart);
    if (ids.length === 0) {
        return 'Košík je prázdný';
    }
    if (ids.length > MAX_CART_ITEMS) {
        return 'Košík obsahuje příliš mnoho položek';
    }
    for (const id of ids) {
        if (typeof id !== 'string' || id.length === 0 || id.length > 100) {
            return 'Neplatné ID produktu';
        }
        const qty = cart[id];
        if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY_PER_ITEM) {
            return 'Neplatné množství';
        }
    }
    return null;
}

function rateLimit(map, max, windowMs, message) {
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const recent = (map.get(ip) || []).filter(t => now - t < windowMs);
        if (recent.length >= max) {
            return res.status(429).json({ error: message });
        }
        recent.push(now);
        map.set(ip, recent);
        next();
    };
}

const rateLimitLogin = rateLimit(loginAttempts, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS, 'Příliš mnoho pokusů, zkus to později');
const rateLimitOrder = rateLimit(orderAttempts, MAX_ORDER_ATTEMPTS, ORDER_WINDOW_MS, 'Příliš mnoho objednávek, zkus to později');

function requireAdmin(req, res, next) {
    const token = req.headers.authorization;
    const expiry = activeTokens.get(token);
    if (!expiry || expiry < Date.now()) {
        activeTokens.delete(token);
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

app.post('/api/login', rateLimitLogin, (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        activeTokens.set(token, Date.now() + TOKEN_TTL);
        return res.json({ token });
    }
    res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
});

app.post('/api/logout', requireAdmin, (req, res) => {
    activeTokens.delete(req.headers.authorization);
    res.json({ success: true });
});

app.get('/api/products', async (req, res) => {
    const snapshot = await productsCollection.get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
    const doc = await productsCollection.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
});

app.post('/api/products', requireAdmin, async (req, res) => {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ error });

    const newProduct = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        image: req.body.image || ''
    };
    const docRef = await productsCollection.add(newProduct);
    res.status(201).json({ id: docRef.id, ...newProduct });
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ error });

    const docRef = productsCollection.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });

    const updated = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        image: req.body.image || ''
    };
    await docRef.update(updated);
    res.json({ id: req.params.id, ...updated });
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    const docRef = productsCollection.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });

    await docRef.delete();
    res.json({ success: true });
});

app.post('/api/order', rateLimitOrder, async (req, res) => {
    const error = validateCart(req.body.cart);
    if (error) return res.status(400).json({ error });

    const ids = Object.keys(req.body.cart);
    const refs = ids.map(id => productsCollection.doc(id));
    const docs = await Promise.all(refs.map(ref => ref.get()));

    const missingIds = [];
    docs.forEach((doc, i) => {
        if (!doc.exists) missingIds.push(ids[i]);
    });

    if (missingIds.length > 0) {
        return res.status(409).json({
            error: 'Některé produkty již nejsou k dispozici',
            missingIds
        });
    }

    await Promise.all(refs.map(ref => ref.delete()));
    res.json({ success: true });
});

function resetState() {
    activeTokens.clear();
    loginAttempts.clear();
    orderAttempts.clear();
}

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server běží na http://localhost:${PORT}`);
    });
}

module.exports = { app, resetState };