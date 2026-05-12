# Smart-Travel-Booking-System-API

A full-stack tour booking application built with **Node.js**, **Express**, **MongoDB**, and **Pug**. tour booking application provides a public website for browsing tours, user authentication and account management, and a REST API for tours, users, reviews, and bookings with **Stripe** checkout integration.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Documentation](#-api-documentation)
- [Query Features](#-query-features)
- [Seed Data](#-seed-data-optional)
- [Security Notes](#-security-notes)
- [Deployment Notes](#-deployment-notes)
- [License](#-license)

---

## ✨ Features

- Tour catalog with filtering, sorting, field limiting, and pagination
- JWT authentication with role-based authorization
- Password reset and email notifications
- Review system with automatic tour rating aggregation
- Stripe Checkout session creation and webhook-driven booking creation
- Geospatial tour queries (`tours-within`, `distances`)
- Image upload and processing with **Multer** and **Sharp**
- Server-side rendered pages using **Pug** templates
- Security hardening (Helmet, rate limiting, NoSQL/XSS sanitization, HPP)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT + Cookies |
| Templating | Pug |
| Payments | Stripe |
| Email | Nodemailer (dev) / SendGrid (prod) |
| Frontend | Axios + Mapbox GL JS |
| Security | Helmet, express-rate-limit, mongo-sanitize, xss-sanitize, hpp |
| Build | esbuild |
| Dev Tools | ESLint, Prettier, Nodemon |

---

## 📁 Project Structure

```
natours/
├── app.js
├── server.js
├── config.env
├── package.json
├── controllers/
│   ├── authController.js
│   ├── bookingController.js
│   ├── errorController.js
│   ├── factoryController.js
│   ├── reviewController.js
│   ├── tourController.js
│   ├── userController.js
│   └── viewController.js
├── models/
│   ├── bookingModel.js
│   ├── reviewModel.js
│   ├── tourModel.js
│   └── userModel.js
├── routes/
│   ├── bookingRoute.js
│   ├── reviewRoute.js
│   ├── tourRoute.js
│   ├── userRoute.js
│   └── viewRoute.js
├── utils/
│   ├── apiFeatures.js
│   ├── appError.js
│   ├── catchAsync.js
│   └── email.js
├── public/
│   ├── css/
│   ├── img/
│   └── js/
├── views/
│   ├── emails/
│   └── *.pug
└── dev-data/
    └── data/
```

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas or local MongoDB instance

### Clone & Install

```bash
git clone <your-repo-url>
cd Smart-Travel-Booking-System-API
npm install
```

---

## 🔐 Environment Variables

Create a `config.env` file in the project root (same level as `server.js`):

```env
NODE_ENV=development
PORT=3000

# MongoDB
DATABASE=mongodb+srv://<USER>:<PASSWORD>@<HOST>/<DB_NAME>?retryWrites=true&w=majority
DATABASE_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_long_random_secret_min_32_chars
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Email — Development (Mailtrap)
EMAIL_USERNAME=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_FROM="App Team <noreply@natours.com>"

# Email — Production (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Mapbox
MAP_BOX_ACCESS_TOKEN=your_mapbox_access_token
```

> ⚠️ Never commit `config.env` to source control. Add it to `.gitignore`.

---

## ▶️ Running the Project

```bash
# Development (with Nodemon auto-restart)
npm run dev

# Production
NODE_ENV=production npm start

# Build frontend bundle
npm run build

# Watch frontend bundle during development
npm run watch

# Linting & Formatting
npm run lint
npm run lint:fix
npm run format
```

**Local:** `http://localhost:3000/api/v1`  
**Production:** `https://smart-travel-booking-system-api.onrender.com/`

---

## 📖 API Documentation

### 🔑 Authentication & Users — `/api/v1/users`

#### Public Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register a new user |
| POST | `/login` | Login and receive JWT cookie |
| GET | `/logout` | Logout user |
| POST | `/forgotPassword` | Send password reset email |
| PATCH | `/resetPassword/:token` | Reset password with token |

#### Protected — Logged-in Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Get current user profile |
| PATCH | `/updateMe` | Update name, email, or photo |
| PATCH | `/updateMyPassword` | Update password |
| DELETE | `/deleteMe` | Soft-delete account |

#### Admin Only

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all users |
| GET | `/:id` | Get user by ID |
| PATCH | `/:id` | Update user by ID |
| DELETE | `/:id` | Delete user by ID |

---

### 🗺 Tours — `/api/v1/tours`

#### Public Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all tours |
| GET | `/:id` | Get single tour |
| GET | `/top-5-tours` | Top rated tours alias |
| GET | `/tours-stats` | Aggregated tour statistics |
| GET | `/tours-within/:distance/center/:latLng/unit/:unit` | Tours within radius |
| GET | `/distances/:latLng/unit/:unit` | Distances from a point |

> Example: `/tours-within/50/center/34.111745,-118.113491/unit/mi`

#### Protected — Admin & Lead-Guide

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create new tour |
| PATCH | `/:id` | Update tour (supports image upload) |
| DELETE | `/:id` | Delete tour |
| GET | `/monthly-plan/:year` | Monthly bookings plan |

#### Nested Route

| Method | Endpoint | Description |
|---|---|---|
| POST | `/:tourId/reviews` | Create review for a tour (user only) |

---

### ⭐ Reviews — `/api/v1/reviews`
 
> All review routes require authentication.
 
#### 🌍 All Roles (any logged-in user)
 
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all reviews |
| GET | `/:id` | Get single review |
 
#### 👤 User Role Only
 
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a new review |
 
#### 🛡 Admin & User Role Only
 
| Method | Endpoint | Description |
|---|---|---|
| PATCH | `/:id` | Update review |
| DELETE | `/:id` | Delete review |

---

### 🎫 Bookings — `/api/v1/bookings`

> All booking routes require authentication.

#### Authenticated Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/checkout-session/:tourId` | Create Stripe Checkout session |

#### Admin & Lead-Guide Only

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all bookings |
| POST | `/` | Create booking manually |
| GET | `/:id` | Get single booking |
| PATCH | `/:id` | Update booking |
| DELETE | `/:id` | Delete booking |

#### Stripe Webhook

| Method | Endpoint | Description |
|---|---|---|
| POST | `/webhook-checkout` | Handles `checkout.session.completed` event |

---

### 🖥 View Routes (SSR Pages)
 
| Route | Description | Middleware |
|---|---|---|
| `GET /` | Overview / all tours | `isLoggedIn` (optional) |
| `GET /tour/:slug` | Single tour page | `isLoggedIn` (optional) |
| `GET /login` | Login page | `isLoggedIn` (optional) |
| `GET /signup` | Signup page | Public |
| `GET /me` | Account settings page | `protect` (required) |
| `GET /my-tours` | My bookings page | `protect` (required) |
 
> **`isLoggedIn`** — optionally attaches user to template if logged in, but does not block access.  
> **`protect`** — requires a valid JWT; redirects to login if not authenticated.

---

## 🔍 Query Features

All collection endpoints support the `APIFeatures` utility:

```
# Filtering
GET /api/v1/tours?difficulty=easy&price[lt]=1500

# Sorting
GET /api/v1/tours?sort=price,-ratingsAverage

# Field Limiting
GET /api/v1/tours?fields=name,price,ratingsAverage

# Pagination (max limit: 100)
GET /api/v1/tours?page=2&limit=10
```

---

## 🌱 Seed Data (Optional)

A data import script is available at `dev-data/data/importData.js`:

```bash
# Import sample data
node dev-data/data/importData.js import

# Delete all data
node dev-data/data/importData.js delete
```

---

## 🔒 Security Notes

- Never commit real secrets or `config.env` to source control
- Rotate all exposed credentials (DB, JWT, Stripe, SendGrid, Mapbox, email) before deployment
- Use separate credentials and keys for development and production environments

---

## 🚢 Deployment Notes

- Set `NODE_ENV=production`
- Ensure MongoDB Atlas connection is accessible from your deployment environment
- Configure Stripe webhook to point to `/webhook-checkout`
- Deploy as a **Web Service** on [Render](https://render.com) — HTTPS and reverse proxy are handled automatically
- Run `npm run build` to bundle frontend assets before deploying

---

## 📄 License

ISC