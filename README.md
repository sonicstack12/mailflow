# Mail Genie (Monorepo)

This repository is split into **three applications**, each running on a **different port**:

- **`customer_frontend/`**: Customer-facing site + customer dashboard UI (Vite + React)
- **`admin_frontend/`**: Admin UI (Vite + React)
- **`backend/`**: Shared backend for both UIs (Express.js + Node.js + MongoDB)

## Local development

### 1) Install dependencies

```sh
npm install
```

### 2) Configure the backend environment

Backend reads `backend/.env` when present; otherwise it falls back to `backend/env.example`.

Ensure MongoDB is running and set correct connection string in `backend/env.example` (or create your own `backend/.env`).

### 3) Run migrations + seed

```sh
npm run db:migrate
npm run db:seed
```

### 4) Start all apps (3 ports)

```sh
npm run dev
```

## Notes

- Ports (dev):
  - customer: `http://localhost:5173`
  - admin: `http://localhost:5174`
  - backend: `http://localhost:4000`
