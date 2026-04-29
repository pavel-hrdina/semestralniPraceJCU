# Semestral Project - Product Catalog

## How to run

```
npm install
npm start
```

Open http://localhost:3000

## Admin login

- Username: `admin`
- Password: `admin123`

## Structure

- `server.js` - Express server with REST API
- `data/products.json` - persistent storage
- `public/index.html` - public view
- `public/admin.html` - admin panel

## API endpoints

- `GET /api/products` - list all
- `GET /api/products/:id` - one product
- `POST /api/login` - login
- `POST /api/products` - create (admin)
- `PUT /api/products/:id` - update (admin)
- `DELETE /api/products/:id` - delete (admin)
