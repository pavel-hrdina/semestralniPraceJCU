# Semestrální projekt - Katalog produktů (Firebase)

Web aplikace s veřejným katalogem produktů a admin sekcí pro správu (CRUD).
Backend Node.js + Express, persistence Firebase Firestore, frontend HTML + Bootstrap + JavaScript.

## Setup

### 1. Vytvoření Firebase projektu

1. Otevři https://console.firebase.google.com
2. Klikni **Add project**, zadej jméno projektu, projdi průvodce
3. V levém menu vyber **Build → Firestore Database**
4. Klikni **Create database**, vyber **Start in production mode**, zvol region (např. `europe-west3` - Frankfurt)

### 2. Získání service account key

1. Ve Firebase konzoli klikni na ozubené kolečko (vlevo nahoře) → **Project settings**
2. Záložka **Service accounts** → **Generate new private key** → **Generate key**
3. Stáhne se JSON soubor - otevři ho v textovém editoru a zkopíruj **celý obsah** (od `{` po `}`)

### 3. Nastavení Codespaces secrets

Přihlaš se na GitHub a v repozitáři, kde máš tento projekt:

1. **Settings → Secrets and variables → Codespaces**
2. Klikni **New repository secret**
3. Vytvoř secret:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** vlož celý JSON obsah z kroku 2
   - Klikni **Add secret**
4. (Volitelné) Vytvoř secret pro admin heslo:
   - **Name:** `ADMIN_PASSWORD`
   - **Value:** zvol si silné heslo

**Důležité:** Po vytvoření secretů musíš Codespace restartovat (nebo otevřít nový),
aby se proměnné prostředí načetly. V běžícím Codespace v terminálu si je můžeš ověřit:

```
echo $FIREBASE_SERVICE_ACCOUNT
```

### 4. Nastavení Firestore security rules

1. Ve Firestore přejdi na záložku **Rules**
2. Vlož toto a klikni **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Tato pravidla blokují veškerý přímý přístup z klienta. Náš Express server používá Admin SDK
se servisním účtem, který tato pravidla obchází (admin má vždy plný přístup).

### 5. Spuštění

V terminálu Codespace:

```
npm install
npm start
```

V pravém dolním rohu se objeví notifikace s odkazem - klikni na **Open in Browser**.
Případně otevři záložku **Ports** a klikni na adresu u portu 3000.

## Admin přihlášení

- Username: `admin`
- Password: `admin123` (nebo to, co jsi nastavil v secret `ADMIN_PASSWORD`)

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

## Lokální spuštění mimo Codespaces (volitelné)

Pokud bys chtěl projekt spustit i lokálně:

1. Stáhni JSON service account key (krok 2 výše)
2. Ulož ho do kořene projektu jako `firebase-key.json`
3. Spusť `npm install && npm start`

Soubor `firebase-key.json` je v `.gitignore` - **nikdy ho neposílej do gitu**.
