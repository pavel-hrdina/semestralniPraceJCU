# Semestrální projekt - Katalog produktů s košíkem

![CI](https://github.com/pavel-hrdina/semestralniPraceJCU/actions/workflows/test.yml/badge.svg)

Webová aplikace mini e-shopu. Veřejná část obsahuje katalog produktů s nákupním košíkem,
admin sekce umožňuje správu produktů včetně obrázků (CRUD).

**Backend:** Node.js + Express
**Persistence:** Firebase Firestore (cloudová NoSQL databáze)
**Frontend:** HTML + Bootstrap 5 + JavaScript (bez frameworku)
**Testy:** Jest + Supertest

## Funkce

### Pro návštěvníky
- Katalog produktů s obrázky, popisy a cenami
- Přidávání do košíku přímo z katalogu
- Košík uložený v `localStorage` prohlížeče
- Změna množství, mazání položek, výpočet celkové ceny
- Dokončení objednávky (vyprázdní košík)

### Pro admina
- Přihlášení jménem a heslem
- Vytvoření, editace a mazání produktů
- Nahrávání obrázků k produktům (max 600 KB, formát JPG / PNG / WebP)
- Tabulka s přehledem všech produktů

## Spuštění

V terminálu Codespace:

```
npm install
npm start
```

## Spouštění testů

```
npm install
npm test
```

Testy běží proti **mock implementaci Firebase** (žádný internet ani skutečná databáze nejsou potřeba).
Pokrývají autentizaci, validaci vstupů a CRUD operace - dohromady 16 testů ve 3 souborech.

## Continuous Integration
 
Projekt má GitHub Actions workflow v `.github/workflows/test.yml`,
který automaticky spouští testy při každém pushi do `main` a u každého pull requestu.

## Struktura projektu

```
semestral-project/
├── server.js                       backend (Express + Firebase Admin SDK)
├── package.json                    závislosti a skripty
├── README.md                       tato dokumentace
├── .gitignore                      ignorované soubory pro git
│
├── public/                         statické soubory pro prohlížeč
│   ├── index.html                  veřejný katalog
│   ├── app.js                      logika katalogu (načtení, košík)
│   ├── cart.html                   stránka košíku
│   ├── cart.js                     logika košíku
│   ├── admin.html                  admin panel (login + CRUD)
│   ├── admin.js                    logika admin panelu
│   └── helpers.js                  sdílené funkce (escapeHtml)
│
├── __mocks__/
│   └── firebase-admin.js           in-memory náhrada Firebase pro testy
│
└── tests/
    ├── setup.js                    nastavení env před testy
    ├── auth.test.js                testy autentizace
    ├── validation.test.js          testy validace
    └── products.test.js            testy CRUD operací
```

## Stránky

| URL | Stránka | Popis |
|-----|---------|-------|
| `/` | `index.html` | Veřejný katalog s tlačítky "Přidat do košíku" |
| `/cart.html` | `cart.html` | Obsah košíku, změna množství, dokončení objednávky |
| `/admin.html` | `admin.html` | Admin panel - login a správa produktů |

## API endpointy

| Metoda | URL | Popis | Vyžaduje admin |
|--------|-----|-------|----------------|
| GET    | `/api/products`     | seznam všech produktů | ne |
| GET    | `/api/products/:id` | jeden produkt | ne |
| POST   | `/api/login`        | přihlášení (vrací token) | - |
| POST   | `/api/logout`       | odhlášení (zneplatní token) | ano |
| POST   | `/api/products`     | vytvoření produktu | ano |
| PUT    | `/api/products/:id` | úprava produktu | ano |
| DELETE | `/api/products/:id` | smazání produktu | ano |

Admin endpointy vyžadují hlavičku `Authorization` s tokenem získaným z `/api/login`.

## Datový model

Dokument v kolekci `products` ve Firestore:

```js
{
  name: "Keramický hrnek",        // string, max 100 znaků
  price: 250,                      // number, >= 0
  description: "Bílý hrnek...",    // string, max 1000 znaků
  image: "data:image/jpeg;..."     // string (base64 data URL) nebo prázdný string
}
```

ID dokumentu generuje automaticky Firestore.

## NPM skripty

| Skript | Co dělá |
|--------|---------|
| `npm install` | Stáhne závislosti |
| `npm start` | Spustí server na portu 3000 |
| `npm test` | Spustí testy přes Jest |

## Bezpečnost

- **Validace na serveru** - každý request kontroluje typ a délku polí
- **Náhodné tokeny** - generované přes `crypto.randomBytes(32)`, expirace 1 hodina
- **Server-side logout** - token se zruší v paměti serveru, ne jen v `localStorage`
- **Rate limiting** - max 5 pokusů přihlášení za 15 minut na IP
- **XSS escapování** - všechna data z databáze se před vložením do DOM escapují
- **Limit JSON body** - max 1 MB (kvůli base64 obrázkům)
- **Firestore rules** - klient nemá přímý přístup k databázi, jen přes server
