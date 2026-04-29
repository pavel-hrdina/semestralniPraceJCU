# Semestrální projekt - Katalog produktů (Firebase)

Web aplikace s veřejným katalogem produktů a admin sekcí pro správu (CRUD).
Backend Node.js + Express, persistence Firebase Firestore, frontend HTML + Bootstrap + JavaScript.

### 1. Spuštění

V terminálu Codespace:

```
npm install
npm start
```

## Struktura projektu

- `server.js` - Express server s REST API + Firebase Admin SDK
- `package.json` - závislosti
- `public/index.html` - veřejný pohled na produkty
- `public/app.js` - načtení a vykreslení produktů
- `public/admin.html` - admin panel (login + CRUD)
- `public/admin.js` - logika admin panelu

## API endpointy

| Metoda | URL | Popis | Vyžaduje admin |
|--------|-----|-------|----------------|
| GET    | `/api/products`     | seznam všech produktů | ne |
| GET    | `/api/products/:id` | jeden produkt | ne |
| POST   | `/api/login`        | přihlášení | - |
| POST   | `/api/logout`       | odhlášení | ano |
| POST   | `/api/products`     | vytvoření produktu | ano |
| PUT    | `/api/products/:id` | úprava produktu | ano |
| DELETE | `/api/products/:id` | smazání produktu | ano |