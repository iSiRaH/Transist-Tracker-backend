# Backend API Endpoints

Base URL prefix: `/api/v1`

Authorization for protected endpoints:

- Header: `Authorization: Bearer <JWT_TOKEN>`

## Health

| Method | Endpoint         | Description                       | Auth   |
| ------ | ---------------- | --------------------------------- | ------ |
| GET    | `/api/v1/health` | Service and database health check | Public |

## Auth

| Method | Endpoint              | Description                        | Auth         |
| ------ | --------------------- | ---------------------------------- | ------------ |
| POST   | `/api/v1/auth/signup` | Register a new user                | Public       |
| POST   | `/api/v1/auth/login`  | Authenticate user and return token | Public       |
| GET    | `/api/v1/auth/me`     | Get logged-in user info            | Bearer token |

## Vehicles

| Method | Endpoint               | Description          | Auth         |
| ------ | ---------------------- | -------------------- | ------------ |
| GET    | `/api/v1/vehicles/`    | Get all vehicles     | Bearer token |
| POST   | `/api/v1/vehicles/`    | Create a new vehicle | Bearer token |
| GET    | `/api/v1/vehicles/:id` | Get vehicle by id    | Bearer token |
| PUT    | `/api/v1/vehicles/:id` | Update vehicle by id | Bearer token |
| DELETE | `/api/v1/vehicles/:id` | Delete vehicle by id | Bearer token |

## Users

| Method | Endpoint            | Description       | Auth         |
| ------ | ------------------- | ----------------- | ------------ |
| GET    | `/api/v1/users/`    | Get all users     | Bearer token |
| POST   | `/api/v1/users/`    | Create a new user | Bearer token |
| GET    | `/api/v1/users/:id` | Get user by id    | Bearer token |
| PUT    | `/api/v1/users/:id` | Update user by id | Bearer token |
| DELETE | `/api/v1/users/:id` | Delete user by id | Bearer token |

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
