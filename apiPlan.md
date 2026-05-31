# Plan: Travel Booking System — Express.js Server

## TL;DR

Build a full-featured travel booking REST API on the existing Express 5 + Prisma 7 + PostgreSQL stack. Covers flights, hotels, car rentals, tour packages, and bus/train booking with OAuth + JWT auth, Stripe payments, email notifications, wishlists, search/filter/pagination, and booking lifecycle management. Two roles: User and Admin.

---

## Phase 1 — Foundation (blocks all other phases)

### 1.1 Install dependencies

New runtime deps: `bcryptjs`, `jsonwebtoken`, `zod`, `passport`, `passport-google-oauth20`, `passport-facebook`, `stripe`, `nodemailer`
New dev deps: `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/passport`, `@types/passport-google-oauth20`, `@types/passport-facebook`, `@types/nodemailer`

### 1.2 Environment config

Create `src/config/env.ts` — validate & export all env vars using Zod:
DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRY, JWT_REFRESH_EXPIRY,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL,
FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM,
CLIENT_URL (for OAuth redirects), PORT

### 1.3 Prisma schema — full data model

Modify `prisma/schema.prisma`. Models:

**Enums:**

- `Role` (USER, ADMIN)
- `BookingStatus` (PENDING, CONFIRMED, CANCELLED, COMPLETED)
- `PaymentStatus` (PENDING, PAID, REFUNDED, FAILED)
- `BookingType` (FLIGHT, HOTEL, CAR_RENTAL, TOUR, TRANSPORT)
- `TransportType` (BUS, TRAIN)
- `CarType` (SEDAN, SUV, HATCHBACK, LUXURY)
- `RoomType` (SINGLE, DOUBLE, SUITE, DELUXE)
- `FlightClass` (ECONOMY, BUSINESS, FIRST)
- `TransportClass` (SLEEPER, SEATER, AC, NON_AC)
- `OAuthProvider` (GOOGLE, FACEBOOK)

**Updated User model:** add `role Role @default(USER)`, `googleId String?`, `facebookId String?`, `provider OAuthProvider?`, make `password` optional (for OAuth-only users). Relations: bookings, wishlists.

**New models:**

- `Flight` — airline, flightNumber, departureCity, arrivalCity, departureAirport, arrivalAirport, departureTime, arrivalTime, price (Decimal), availableSeats, totalSeats, class (FlightClass), createdAt, updatedAt. Relation: flightBookings.
- `Hotel` — name, description, city, country, address, latitude?, longitude?, starRating, images (String[]), amenities (String[]), createdAt, updatedAt. Relation: rooms.
- `Room` — hotelId (FK), type (RoomType), pricePerNight (Decimal), availableRooms, totalRooms, amenities (String[]), createdAt, updatedAt. Relation: hotel, hotelBookings.
- `CarRental` — company, carModel, type (CarType), city, pricePerDay (Decimal), available (Boolean), features (String[]), images (String[]), createdAt, updatedAt. Relation: carRentalBookings.
- `TourPackage` — title, description, destination, durationDays, price (Decimal), maxGroupSize, availableSlots, images (String[]), inclusions (String[]), exclusions (String[]), createdAt, updatedAt. Relation: tourBookings.
- `Transport` — type (TransportType), operator, routeFrom, routeTo, departureTime, arrivalTime, price (Decimal), availableSeats, totalSeats, class (TransportClass), createdAt, updatedAt. Relation: transportBookings.
- `Booking` — userId (FK), bookingType (BookingType), status (BookingStatus), totalAmount (Decimal), paymentStatus (PaymentStatus), stripePaymentIntentId?, cancellationReason?, createdAt, updatedAt. Relations: user, payment, flightBooking?, hotelBooking?, carRentalBooking?, tourBooking?, transportBooking?.
- `FlightBooking` — bookingId (FK unique), flightId (FK), passengers (Json), seatNumbers (String[]).
- `HotelBooking` — bookingId (FK unique), roomId (FK), checkIn (DateTime), checkOut (DateTime), guests (Int).
- `CarRentalBooking` — bookingId (FK unique), carRentalId (FK), pickupDate, dropoffDate, pickupLocation, dropoffLocation.
- `TourBooking` — bookingId (FK unique), tourPackageId (FK), travelDate (DateTime), numberOfPeople (Int).
- `TransportBooking` — bookingId (FK unique), transportId (FK), passengers (Json), seatNumbers (String[]).
- `Wishlist` — userId (FK), itemType (BookingType), itemId (Int), createdAt. @@unique([userId, itemType, itemId]).
- `Payment` — bookingId (FK unique), stripePaymentIntentId, amount (Decimal), currency (default "usd"), status (PaymentStatus), createdAt, updatedAt.

Run `npx prisma migrate dev --name full_schema` after.

### 1.4 Utility modules (parallel tasks)

- `src/lib/errors.ts` — custom `AppError` class extending Error with statusCode, isOperational fields
- `src/lib/jwt.ts` — `generateAccessToken(payload)`, `generateRefreshToken(payload)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)` using jsonwebtoken
- `src/lib/hash.ts` — `hashPassword(plain)`, `comparePassword(plain, hashed)` using bcryptjs
- `src/lib/pagination.ts` — `buildPaginationParams(query)` → returns `{ skip, take, page, limit }` and `buildPaginatedResponse(data, total, page, limit)`

### 1.5 Core middlewares (parallel tasks)

- `src/middlewares/errorHandler.middleware.ts` — global Express error handler (catches AppError, Zod validation errors, unknown errors). Returns JSON `{ success: false, message, errors? }`.
- `src/middlewares/auth.middleware.ts` — `authenticate` middleware: extracts Bearer token, verifies JWT, attaches `req.user` (`{ id, email, role }`). Returns 401 on failure.
- `src/middlewares/admin.middleware.ts` — `authorizeAdmin` middleware: checks `req.user.role === 'ADMIN'`. Returns 403 on failure.
- `src/middlewares/validate.middleware.ts` — `validate(zodSchema)` factory: validates `req.body` / `req.query` / `req.params` against Zod schema, throws on failure.

### 1.6 Update `src/index.ts`

- Import and apply error handler middleware (must be last)
- Import route aggregator `src/routes/index.ts`, mount at `/api`
- Add `express.raw({ type: 'application/json' })` on `/api/payments/webhook` for Stripe
- Use env config for PORT

---

## Phase 2 — Authentication & Users (depends on Phase 1)

### 2.1 Passport config

- `src/config/passport.ts` — configure Google and Facebook OAuth strategies using Passport. Each strategy: find or create user by provider ID, link to existing email if found.

### 2.2 Auth module

- `src/services/auth.service.ts` — register, login, refreshToken, forgotPassword, resetPassword, verifyOtp, oauthLogin
- `src/controllers/auth.controller.ts` — handler functions calling service
- `src/routes/auth.routes.ts`
  - POST `/register` — validate with Zod, hash password, create user, send OTP email, return tokens
  - POST `/login` — verify credentials, return access + refresh tokens
  - POST `/logout` — clear refreshToken in DB
  - POST `/refresh-token` — verify refresh token, issue new pair
  - POST `/forgot-password` — generate OTP, send email
  - POST `/reset-password` — verify OTP, update password
  - POST `/verify-otp` — verify registration OTP
  - GET `/google` — passport.authenticate('google')
  - GET `/google/callback` — handle OAuth callback, return tokens
  - GET `/facebook` — passport.authenticate('facebook')
  - GET `/facebook/callback` — handle OAuth callback, return tokens

### 2.3 Email service

- `src/services/email.service.ts` — `sendOtpEmail(to, otp)`, `sendBookingConfirmation(to, booking)`, `sendCancellationEmail(to, booking)` using nodemailer

### 2.4 User module

- `src/services/user.service.ts` — getProfile, updateProfile, changePassword, getAllUsers (admin), deleteUser (admin)
- `src/controllers/user.controller.ts`
- `src/routes/user.routes.ts`
  - GET `/me` — authenticated
  - PUT `/me` — authenticated, update name/profilePicture
  - PUT `/me/password` — authenticated, change password
  - GET `/` — admin only, paginated user list
  - DELETE `/:id` — admin only

---

## Phase 3 — Resource Modules (depends on Phase 1; all 5 sub-modules are parallel with each other)

Each resource follows the same pattern: service → controller → routes → Zod schemas.

### 3.1 Flights module

- `src/services/flight.service.ts` — CRUD + search (by cities, dates, class, price range) with pagination
- `src/controllers/flight.controller.ts`
- `src/routes/flight.routes.ts`
  - GET `/` — public, search/filter/paginate
  - GET `/:id` — public
  - POST `/` — admin
  - PUT `/:id` — admin
  - DELETE `/:id` — admin

### 3.2 Hotels module

- `src/services/hotel.service.ts` — Hotel CRUD + Room CRUD + search (by city, dates, star rating, price range)
- `src/controllers/hotel.controller.ts`
- `src/routes/hotel.routes.ts`
  - GET `/` — public, search/filter/paginate
  - GET `/:id` — public (include rooms)
  - POST `/` — admin
  - PUT `/:id` — admin
  - DELETE `/:id` — admin
  - POST `/:id/rooms` — admin
  - PUT `/:id/rooms/:roomId` — admin
  - DELETE `/:id/rooms/:roomId` — admin

### 3.3 Car rentals module

- `src/services/carRental.service.ts` — CRUD + search (by city, type, price range, availability)
- `src/controllers/carRental.controller.ts`
- `src/routes/carRental.routes.ts`
  - GET `/` — public, search/filter/paginate
  - GET `/:id` — public
  - POST `/` — admin
  - PUT `/:id` — admin
  - DELETE `/:id` — admin

### 3.4 Tour packages module

- `src/services/tourPackage.service.ts` — CRUD + search (by destination, duration, price range, availability)
- `src/controllers/tourPackage.controller.ts`
- `src/routes/tourPackage.routes.ts`
  - GET `/` — public, search/filter/paginate
  - GET `/:id` — public
  - POST `/` — admin
  - PUT `/:id` — admin
  - DELETE `/:id` — admin

### 3.5 Transport module

- `src/services/transport.service.ts` — CRUD + search (by type, route, date, class)
- `src/controllers/transport.controller.ts`
- `src/routes/transport.routes.ts`
  - GET `/` — public, search/filter/paginate
  - GET `/:id` — public
  - POST `/` — admin
  - PUT `/:id` — admin
  - DELETE `/:id` — admin

---

## Phase 4 — Bookings & Payments (depends on Phases 2 + 3)

### 4.1 Stripe config

- `src/config/stripe.ts` — initialize Stripe SDK with secret key

### 4.2 Payment service

- `src/services/payment.service.ts` — `createPaymentIntent(amount, currency, metadata)`, `handleWebhook(event)` (updates booking/payment status on payment_intent.succeeded, payment_intent.payment_failed)

### 4.3 Booking module

- `src/services/booking.service.ts`
  - `createBooking(userId, bookingType, details)` — validates availability, decrements available seats/rooms/slots, creates Booking + type-specific booking record, creates Stripe payment intent, returns booking + clientSecret
  - `getUserBookings(userId, pagination)` — with filters by status, type
  - `getBookingById(bookingId, userId)` — with full details (include type-specific record)
  - `cancelBooking(bookingId, userId, reason)` — update status, restore availability, trigger refund if paid, send cancellation email
  - `getAllBookings(pagination)` — admin
  - `updateBookingStatus(bookingId, status)` — admin
- `src/controllers/booking.controller.ts`
- `src/routes/booking.routes.ts`
  - POST `/` — authenticated, create booking
  - GET `/` — authenticated, user's bookings (paginated)
  - GET `/:id` — authenticated, booking detail
  - PATCH `/:id/cancel` — authenticated, cancel own booking
  - GET `/admin/all` — admin, all bookings
  - PATCH `/admin/:id/status` — admin, update status

### 4.4 Payment routes

- `src/controllers/payment.controller.ts`
- `src/routes/payment.routes.ts`
  - POST `/webhook` — Stripe webhook (raw body, signature verification)
  - GET `/:bookingId` — authenticated, payment details for booking

---

## Phase 5 — Wishlist (depends on Phase 2)

### 5.1 Wishlist module

- `src/services/wishlist.service.ts` — add, remove, getUserWishlist (with pagination, resolves item details based on type)
- `src/controllers/wishlist.controller.ts`
- `src/routes/wishlist.routes.ts`
  - GET `/` — authenticated, paginated
  - POST `/` — authenticated, add item
  - DELETE `/:id` — authenticated, remove item

---

## Phase 6 — Route Aggregation & Final Wiring (depends on all above)

### 6.1 Route aggregator

- `src/routes/index.ts` — import all route files, mount:
  - `/auth` → authRoutes
  - `/users` → userRoutes
  - `/flights` → flightRoutes
  - `/hotels` → hotelRoutes
  - `/car-rentals` → carRentalRoutes
  - `/tours` → tourRoutes
  - `/transports` → transportRoutes
  - `/bookings` → bookingRoutes
  - `/payments` → paymentRoutes
  - `/wishlist` → wishlistRoutes

### 6.2 Seed script

- Update `script.ts` to seed sample data for all models (admin user, sample flights, hotels with rooms, cars, tours, transports)

---

## API Endpoints Summary

### Auth — `/api/auth`

| Method | Endpoint             | Auth   | Description             |
| ------ | -------------------- | ------ | ----------------------- |
| POST   | `/register`          | Public | Register new user       |
| POST   | `/login`             | Public | Login with credentials  |
| POST   | `/logout`            | User   | Clear refresh token     |
| POST   | `/refresh-token`     | Public | Refresh access token    |
| POST   | `/forgot-password`   | Public | Send password reset OTP |
| POST   | `/reset-password`    | Public | Reset password with OTP |
| POST   | `/verify-otp`        | Public | Verify registration OTP |
| GET    | `/google`            | Public | Initiate Google OAuth   |
| GET    | `/google/callback`   | Public | Google OAuth callback   |
| GET    | `/facebook`          | Public | Initiate Facebook OAuth |
| GET    | `/facebook/callback` | Public | Facebook OAuth callback |

### Users — `/api/users`

| Method | Endpoint       | Auth  | Description                |
| ------ | -------------- | ----- | -------------------------- |
| GET    | `/me`          | User  | Get own profile            |
| PUT    | `/me`          | User  | Update own profile         |
| PUT    | `/me/password` | User  | Change password            |
| GET    | `/`            | Admin | List all users (paginated) |
| DELETE | `/:id`         | Admin | Delete a user              |

### Flights — `/api/flights`

| Method | Endpoint | Auth   | Description                    |
| ------ | -------- | ------ | ------------------------------ |
| GET    | `/`      | Public | Search/filter/paginate flights |
| GET    | `/:id`   | Public | Get flight details             |
| POST   | `/`      | Admin  | Create flight                  |
| PUT    | `/:id`   | Admin  | Update flight                  |
| DELETE | `/:id`   | Admin  | Delete flight                  |

### Hotels — `/api/hotels`

| Method | Endpoint             | Auth   | Description                   |
| ------ | -------------------- | ------ | ----------------------------- |
| GET    | `/`                  | Public | Search/filter/paginate hotels |
| GET    | `/:id`               | Public | Get hotel details with rooms  |
| POST   | `/`                  | Admin  | Create hotel                  |
| PUT    | `/:id`               | Admin  | Update hotel                  |
| DELETE | `/:id`               | Admin  | Delete hotel                  |
| POST   | `/:id/rooms`         | Admin  | Add room to hotel             |
| PUT    | `/:id/rooms/:roomId` | Admin  | Update room                   |
| DELETE | `/:id/rooms/:roomId` | Admin  | Delete room                   |

### Car Rentals — `/api/car-rentals`

| Method | Endpoint | Auth   | Description                        |
| ------ | -------- | ------ | ---------------------------------- |
| GET    | `/`      | Public | Search/filter/paginate car rentals |
| GET    | `/:id`   | Public | Get car rental details             |
| POST   | `/`      | Admin  | Create car rental listing          |
| PUT    | `/:id`   | Admin  | Update car rental                  |
| DELETE | `/:id`   | Admin  | Delete car rental                  |

### Tour Packages — `/api/tours`

| Method | Endpoint | Auth   | Description                          |
| ------ | -------- | ------ | ------------------------------------ |
| GET    | `/`      | Public | Search/filter/paginate tour packages |
| GET    | `/:id`   | Public | Get tour package details             |
| POST   | `/`      | Admin  | Create tour package                  |
| PUT    | `/:id`   | Admin  | Update tour package                  |
| DELETE | `/:id`   | Admin  | Delete tour package                  |

### Transport — `/api/transports`

| Method | Endpoint | Auth   | Description                              |
| ------ | -------- | ------ | ---------------------------------------- |
| GET    | `/`      | Public | Search/filter/paginate bus/train options |
| GET    | `/:id`   | Public | Get transport details                    |
| POST   | `/`      | Admin  | Create transport listing                 |
| PUT    | `/:id`   | Admin  | Update transport                         |
| DELETE | `/:id`   | Admin  | Delete transport                         |

### Bookings — `/api/bookings`

| Method | Endpoint            | Auth  | Description           |
| ------ | ------------------- | ----- | --------------------- |
| POST   | `/`                 | User  | Create a booking      |
| GET    | `/`                 | User  | List own bookings     |
| GET    | `/:id`              | User  | Get booking detail    |
| PATCH  | `/:id/cancel`       | User  | Cancel own booking    |
| GET    | `/admin/all`        | Admin | List all bookings     |
| PATCH  | `/admin/:id/status` | Admin | Update booking status |

### Payments — `/api/payments`

| Method | Endpoint      | Auth            | Description            |
| ------ | ------------- | --------------- | ---------------------- |
| POST   | `/webhook`    | Stripe (signed) | Stripe webhook handler |
| GET    | `/:bookingId` | User            | Get payment details    |

### Wishlist — `/api/wishlist`

| Method | Endpoint | Auth | Description          |
| ------ | -------- | ---- | -------------------- |
| GET    | `/`      | User | List wishlist        |
| POST   | `/`      | User | Add to wishlist      |
| DELETE | `/:id`   | User | Remove from wishlist |

---

## Files Overview

### Existing (to modify)

- `prisma/schema.prisma` — add all new models, enums, relations
- `src/index.ts` — add middleware stack, route mounting, error handler
- `lib/prisma.ts` — no changes needed (already configured)
- `package.json` — add new dependencies
- `script.ts` — expand seed script

### New files to create (~40 files)

**Config:**

- `src/config/env.ts`, `src/config/passport.ts`, `src/config/stripe.ts`

**Lib:**

- `src/lib/errors.ts`, `src/lib/jwt.ts`, `src/lib/hash.ts`, `src/lib/pagination.ts`

**Middlewares:**

- `src/middlewares/errorHandler.middleware.ts`
- `src/middlewares/auth.middleware.ts`
- `src/middlewares/admin.middleware.ts`
- `src/middlewares/validate.middleware.ts`

**Services:**

- `src/services/auth.service.ts`
- `src/services/user.service.ts`
- `src/services/email.service.ts`
- `src/services/flight.service.ts`
- `src/services/hotel.service.ts`
- `src/services/carRental.service.ts`
- `src/services/tourPackage.service.ts`
- `src/services/transport.service.ts`
- `src/services/booking.service.ts`
- `src/services/wishlist.service.ts`
- `src/services/payment.service.ts`

**Controllers:**

- `src/controllers/auth.controller.ts`
- `src/controllers/user.controller.ts`
- `src/controllers/flight.controller.ts`
- `src/controllers/hotel.controller.ts`
- `src/controllers/carRental.controller.ts`
- `src/controllers/tourPackage.controller.ts`
- `src/controllers/transport.controller.ts`
- `src/controllers/booking.controller.ts`
- `src/controllers/wishlist.controller.ts`
- `src/controllers/payment.controller.ts`

**Routes:**

- `src/routes/index.ts`
- `src/routes/auth.routes.ts`
- `src/routes/user.routes.ts`
- `src/routes/flight.routes.ts`
- `src/routes/hotel.routes.ts`
- `src/routes/carRental.routes.ts`
- `src/routes/tourPackage.routes.ts`
- `src/routes/transport.routes.ts`
- `src/routes/booking.routes.ts`
- `src/routes/wishlist.routes.ts`
- `src/routes/payment.routes.ts`

---

## Verification Checklist

1. `npx prisma migrate dev` — schema compiles and migrates cleanly
2. `npx tsc --noEmit` — all TypeScript compiles without errors
3. `npm run dev` — server starts on configured PORT
4. Test auth flow: register → verify OTP → login → access protected route → refresh token → logout
5. Test OAuth: hit `/api/auth/google`, complete flow, verify user created with googleId
6. Test admin CRUD: create flight/hotel/car/tour/transport as admin, verify 403 for non-admin
7. Test search: GET `/api/flights?departureCity=NYC&class=ECONOMY&page=1&limit=10` returns paginated filtered results
8. Test booking flow: create booking → verify Stripe payment intent created → simulate webhook → verify booking status updated to CONFIRMED → verify email sent
9. Test cancellation: cancel booking → verify availability restored, payment refund triggered
10. Test wishlist: add/list/remove items
11. Verify error handling: invalid input → 400 with Zod errors, missing auth → 401, non-admin → 403, not-found → 404

---

## Key Decisions

- **Zod** for request validation (not Joi/express-validator) — integrates well with TypeScript
- **Polymorphic bookings** via a parent `Booking` table + type-specific child tables (FlightBooking, HotelBooking, etc.) with 1:1 relations — avoids nullable column sprawl
- Prices stored as `Decimal` type in Prisma for financial accuracy
- OAuth users can have `password = null` (won't be able to use password-based login unless they set one)
- Wishlists use `itemType + itemId` pattern (not polymorphic FK) since Prisma doesn't support polymorphic relations natively — constrained by `@@unique([userId, itemType, itemId])`
- Stripe payment intents created at booking time; booking confirmed only after webhook confirmation
- `CORS origin: "*"` should be narrowed to `CLIENT_URL` in production

---

## Further Considerations

1. **File uploads for images** — Currently images are stored as string URLs. Consider adding Multer + cloud storage (S3/Cloudinary) integration for upload endpoints. Defer to a later phase.
2. **Rate limiting** — Consider `express-rate-limit` on auth routes to prevent brute-force. Add in Phase 2 as a simple middleware.
3. **Logging** — Consider adding `pino` or `winston` for structured production logging. Add in Phase 1 as a foundation utility.
