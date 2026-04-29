const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOKEN_TTL = 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const activeTokens = new Map();
const loginAttempts = new Map();

app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

function readProducts() {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeProducts(products) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

function validateProduct(body) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.length > 100) {
        return 'Invalid name';
    }
    if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0) {
        return 'Invalid price';
    }
    if (typeof body.description !== 'string' || body.description.length > 1000) {
        return 'Invalid description';
    }
    return null;
}

function rateLimitLogin(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const recent = (loginAttempts.get(ip) || []).filter(t => now - t < LOGIN_WINDOW_MS);
    if (recent.length >= MAX_LOGIN_ATTEMPTS) {
        return res.status(429).json({ error: 'Too many attempts, try later' });
    }
    recent.push(now);
    loginAttempts.set(ip, recent);
    next();
}

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
    res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', requireAdmin, (req, res) => {
    activeTokens.delete(req.headers.authorization);
    res.json({ success: true });
});

app.get('/api/products', (req, res) => {
    res.json(readProducts());
});

app.get('/api/products/:id', (req, res) => {
    const product = readProducts().find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
});

app.post('/api/products', requireAdmin, (req, res) => {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ error });

    const products = readProducts();
    const newProduct = {
        id: Date.now().toString(),
        name: req.body.name,
        price: req.body.price,
        description: req.body.description
    };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ error });

    const products = readProducts();
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    products[index] = {
        id: products[index].id,
        name: req.body.name,
        price: req.body.price,
        description: req.body.description
    };
    writeProducts(products);
    res.json(products[index]);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const products = readProducts();
    const filtered = products.filter(p => p.id !== req.params.id);
    if (filtered.length === products.length) {
        return res.status(404).json({ error: 'Not found' });
    }
    writeProducts(filtered);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
