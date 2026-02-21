# Transit Tracker Backend

## Setup

1. Copy `.env.example` to `.env`.
2. Fill the values for `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `PORT`.
3. Install dependencies:

```bash
npm install
```

4. Start development server:

```bash
npm run start:dev
```

## Base URL

`http://localhost:3000/api/v1`

## Endpoints

### Health

- `GET /api/v1/health`

### Signup

- `POST /api/v1/auth/signup`

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

### Login

- `POST /api/v1/auth/login`

Request body:

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

## Success Response (signup/login)

```json
{
  "success": true,
  "token": "<jwt-token>",
  "user": {
    "id": "<user-id>",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
