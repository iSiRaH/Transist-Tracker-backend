# Backend API Endpoints

Base URL prefix: `/api/v1`

Authorization for protected endpoints:

- Header: `Authorization: Bearer <JWT_TOKEN>`

## Health

| Method | Endpoint         | Description                       | Auth   |
| ------ | ---------------- | --------------------------------- | ------ |
| GET    | `/api/v1/health` | Service and database health check | Public |

## Auth

| Method | Endpoint                                    | Description                                                          | Auth                  |
| ------ | ------------------------------------------- | -------------------------------------------------------------------- | --------------------- |
| POST   | `/api/v1/auth/signup`                       | Register a user/driver (role: `user` or `driver`)                    | Public                |
| POST   | `/api/v1/auth/login`                        | Authenticate user or driver and return JWT token                     | Public                |
| POST   | `/api/v1/auth/forgot-password`              | Send 6-digit verification code to user email for password reset      | Public                |
| PATCH  | `/api/v1/auth/reset-password`               | Reset password using 6-digit email code (or token)                   | Public                |
| PATCH  | `/api/v1/auth/reset-password/:token`        | Reset password using token in URL parameter                          | Public                |
| POST   | `/api/v1/auth/user/signup`                  | Register a new passenger user account                                | Public                |
| POST   | `/api/v1/auth/user/login`                   | Authenticate a passenger user account                                | Public                |
| POST   | `/api/v1/auth/driver/signup`                | Register a new driver account                                        | Public                |
| POST   | `/api/v1/auth/driver/login`                 | Authenticate a driver account                                        | Public                |
| POST   | `/api/v1/auth/admin/signup`                 | Register an admin account (optional secret key)                      | Public                |
| POST   | `/api/v1/auth/admin/login`                  | Authenticate an admin account                                        | Public                |
| POST   | `/api/v1/auth/deactivate-account/request-code` | Request a 6-digit verification code to disable/deactivate account  | Optional Bearer / Body|
| PATCH  | `/api/v1/auth/deactivate-account`           | Confirm account deactivation using 6-digit email code                | Optional Bearer / Body|
| POST   | `/api/v1/auth/delete-account/request-code`  | Request a 6-digit verification code to permanently delete account   | Optional Bearer / Body|
| DELETE | `/api/v1/auth/delete-account`               | Confirm permanent account deletion using 6-digit email code          | Optional Bearer / Body|
| GET    | `/api/v1/auth/me`                           | Get logged-in user, driver, or admin info                            | Bearer token          |

## Vehicles

| Method | Endpoint               | Description          | Auth         |
| ------ | ---------------------- | -------------------- | ------------ |
| GET    | `/api/v1/vehicles/`    | Get all vehicles     | Bearer token |
| POST   | `/api/v1/vehicles/`    | Create a new vehicle | Bearer token |
| GET    | `/api/v1/vehicles/:id` | Get vehicle by id    | Bearer token |
| PUT    | `/api/v1/vehicles/:id` | Update vehicle by id | Bearer token |
| DELETE | `/api/v1/vehicles/:id` | Delete vehicle by id | Bearer token |

## Users (Admin Management)

| Method | Endpoint                         | Description                                            | Auth                 |
| ------ | -------------------------------- | ------------------------------------------------------ | -------------------- |
| GET    | `/api/v1/users/`                 | Get all users (supports `?role=` and `?isActive=`)     | Bearer token (Admin) |
| POST   | `/api/v1/users/`                 | Create a new user (with role `user`, `driver`, `admin`)| Bearer token (Admin) |
| GET    | `/api/v1/users/:id`              | Get user by id (includes `isActive`)                   | Bearer token (Admin) |
| PUT    | `/api/v1/users/:id`              | Update user by id (with safety guards)                 | Bearer token (Admin) |
| PATCH  | `/api/v1/users/:id/deactivate`   | Safely deactivate a user account                       | Bearer token (Admin) |
| PATCH  | `/api/v1/users/:id/reactivate`   | Safely reactivate a deactivated user account           | Bearer token (Admin) |
| DELETE | `/api/v1/users/:id`              | Delete user by id (with safety guards)                 | Bearer token (Admin) |

### User Safety Protections
- **Self-Action Prevention**: Admins cannot deactivate, demote, or delete their own accounts.
- **Last-Admin Safeguard**: The last active admin in the system cannot be deactivated, demoted, or deleted to prevent lockout.
- **Session Revocation**: Deactivating a user immediately revokes any active JWT tokens (`passwordChangedAt` timestamp updated and `isActive: false` enforced in auth middleware).
- **Redundant Status Prevention**: Attempts to deactivate an already deactivated user or reactivate an already active user return clear 400 responses.

## Email Verification & Authentication Activity Notifications

### Email Verification Codes (10-Minute Expiry)
For critical account-altering actions, a 6-digit code is generated, cryptographically hashed with SHA-256 in the database, and emailed to the user:
1. **Forget Password**:
   - `POST /api/v1/auth/forgot-password` (Body: `{ "email": "user@example.com" }`) -> Sends 6-digit code to email.
   - `PATCH /api/v1/auth/reset-password` (Body: `{ "email": "user@example.com", "code": "123456", "newPassword": "...", "passwordConfirm": "..." }`) -> Validates code and updates password.
2. **Disable / Deactivate Account**:
   - `POST /api/v1/auth/deactivate-account/request-code` (Bearer token or Body `{ "email": "...", "password": "..." }`) -> Sends 6-digit deactivation code to email.
   - `PATCH /api/v1/auth/deactivate-account` (Bearer token or Body `{ "email": "...", "code": "123456" }`) -> Deactivates account, updates `passwordChangedAt` to revoke active JWT sessions.
3. **Delete Account**:
   - `POST /api/v1/auth/delete-account/request-code` (Bearer token or Body `{ "email": "...", "password": "..." }`) -> Sends 6-digit deletion code with critical warning.
   - `DELETE /api/v1/auth/delete-account` (Bearer token or Body `{ "email": "...", "code": "123456" }`) -> Permanently removes account and clears cookies.

### Automated Email Notifications
- **Welcome Email**: Sent automatically upon signup (`user`, `driver`, or `admin`).
- **Password Changed Alert**: Sent immediately after successful password reset.
- **Account Deactivated Alert**: Sent when account is deactivated (by user with code or by administrator).
- **Account Reactivated Alert**: Sent when account is reactivated by an administrator.
- **Account Deleted Alert**: Sent when account is permanently deleted.

### Email Configuration (.env)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM="Transit Tracker <no-reply@transittracker.com>"
```


## Routes

| Method | Endpoint             | Description        | Auth         |
| ------ | -------------------- | ------------------ | ------------ |
| GET    | `/api/v1/routes/`    | Get all routes     | Bearer token |
| POST   | `/api/v1/routes/`    | Create a new route | Bearer token |
| GET    | `/api/v1/routes/:id` | Get route by id    | Bearer token |
| PUT    | `/api/v1/routes/:id` | Update route by id | Bearer token |
| DELETE | `/api/v1/routes/:id` | Delete route by id | Bearer token |

## Trips

| Method | Endpoint            | Description       | Auth         |
| ------ | ------------------- | ----------------- | ------------ |
| GET    | `/api/v1/trips/`    | Get all trips     | Bearer token |
| POST   | `/api/v1/trips/`    | Create a new trip | Bearer token |
| GET    | `/api/v1/trips/:id` | Get trip by id    | Bearer token |
| PUT    | `/api/v1/trips/:id` | Update trip by id | Bearer token |
| DELETE | `/api/v1/trips/:id` | Delete trip by id | Bearer token |

## Favorites

| Method | Endpoint                | Description           | Auth         |
| ------ | ----------------------- | --------------------- | ------------ |
| GET    | `/api/v1/favorites/`    | Get all favorites     | Bearer token |
| POST   | `/api/v1/favorites/`    | Create a new favorite | Bearer token |
| GET    | `/api/v1/favorites/:id` | Get favorite by id    | Bearer token |
| PUT    | `/api/v1/favorites/:id` | Update favorite by id | Bearer token |
| DELETE | `/api/v1/favorites/:id` | Delete favorite by id | Bearer token |

## Location Logs

| Method | Endpoint                    | Description               | Auth         |
| ------ | --------------------------- | ------------------------- | ------------ |
| GET    | `/api/v1/location-logs/`    | Get all location logs     | Bearer token |
| POST   | `/api/v1/location-logs/`    | Create a new location log | Bearer token |
| GET    | `/api/v1/location-logs/:id` | Get location log by id    | Bearer token |
| PUT    | `/api/v1/location-logs/:id` | Update location log by id | Bearer token |
| DELETE | `/api/v1/location-logs/:id` | Delete location log by id | Bearer token |

## Notifications

| Method | Endpoint                    | Description               | Auth         |
| ------ | --------------------------- | ------------------------- | ------------ |
| GET    | `/api/v1/notifications/`    | Get all notifications     | Bearer token |
| POST   | `/api/v1/notifications/`    | Create a new notification | Bearer token |
| GET    | `/api/v1/notifications/:id` | Get notification by id    | Bearer token |
| PUT    | `/api/v1/notifications/:id` | Update notification by id | Bearer token |
| DELETE | `/api/v1/notifications/:id` | Delete notification by id | Bearer token |

## Role-Based Access Rules

Roles: `user`, `driver`, `admin`

- Users endpoints (`/api/v1/users/*`): `admin`
- Vehicles endpoints (`/api/v1/vehicles/*`):
  - `GET`: `user`, `driver`, `admin`
  - `POST`, `PUT`, `DELETE`: `admin`
- Routes endpoints (`/api/v1/routes/*`):
  - `GET`: `user`, `driver`, `admin`
  - `POST`, `PUT`, `DELETE`: `admin`
- Trips endpoints (`/api/v1/trips/*`):
  - `GET`: `user`, `driver`, `admin`
  - `POST`, `PUT`: `driver`, `admin`
  - `DELETE`: `admin`
- Location logs endpoints (`/api/v1/location-logs/*`):
  - `GET`, `POST`, `PUT`: `driver`, `admin`
  - `DELETE`: `admin`
- Favorites endpoints (`/api/v1/favorites/*`): `user`, `admin`
- Notifications endpoints (`/api/v1/notifications/*`):
  - `GET`, `PUT`: `user`, `driver`, `admin`
  - `POST`, `DELETE`: `admin`

## CLI Admin Management
To quickly seed or provision an administrator via the CLI:
```bash
npm run seed:admin
# Or with custom arguments:
node src/scripts/createAdmin.js --name "Admin Name" --email "admin@transit.lk" --password "SecurePass123"
```
