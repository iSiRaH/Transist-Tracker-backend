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

- `POST /api/v1/auth/signup` (Generic signup with optional `"role": "user"` or `"role": "driver"`)
- `POST /api/v1/auth/user/signup` (Passenger signup)
- `POST /api/v1/auth/driver/signup` (Driver signup)

Request body (Driver example):

```json
{
  "name": "Saman Kumara",
  "email": "driver.saman@transit.lk",
  "password": "password123",
  "passwordConfirm": "password123",
  "role": "driver",
  "phone": "+94771234567",
  "licenseNumber": "DL-98765"
}
```

### Login

- `POST /api/v1/auth/login` (Generic login)
- `POST /api/v1/auth/user/login` (Passenger login)
- `POST /api/v1/auth/driver/login` (Driver login)

Request body:

```json
{
  "email": "driver.saman@transit.lk",
  "password": "password123",
  "role": "driver"
}
```

## Success Response (signup/login)

```json
{
  "status": "Success",
  "token": "<jwt-token>",
  "data": {
    "user": {
      "id": "<user-id>",
      "name": "Saman Kumara",
      "email": "driver.saman@transit.lk",
      "role": "driver",
      "phone": "+94771234567",
      "licenseNumber": "DL-98765",
      "profileImage": null,
      "isActive": true
    }
  }
}
```
