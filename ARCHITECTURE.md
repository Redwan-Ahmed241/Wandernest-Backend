# 🏗️ WanderNest Booking System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│           (React/Next.js - Not part of this project)           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    EXPRESS.JS BACKEND                           │
│                     (This Project)                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   API Routes                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  /api/auth         → Authentication (Register/Login)     │  │
│  │  /api/packages     → Browse Packages                     │  │
│  │  /api/hotels       → Browse Hotels                       │  │
│  │  /api/flights      → Browse Flights                      │  │
│  │  /api/bookings     → Booking Operations                  │  │
│  │  /api/dashboard    → User Statistics                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │              Middleware Layer                            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  - JWT Authentication                                    │  │
│  │  - Input Validation (express-validator)                 │  │
│  │  - Error Handling                                        │  │
│  │  - CORS                                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │               Controllers                                │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  - authController      (Login/Register)                 │  │
│  │  - packageController   (Browse Packages)                │  │
│  │  - hotelController     (Browse Hotels)                  │  │
│  │  - flightController    (Browse Flights)                 │  │
│  │  - bookingController   (Book/Cancel/View Bookings)      │  │
│  │  - dashboardController (User Stats)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │          Supabase Client (@supabase/supabase-js)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ PostgreSQL Protocol
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Django Tables (Existing)                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  users              - User accounts                      │  │
│  │  packages_package   - Available packages                 │  │
│  │  hotels_hotel       - Available hotels                   │  │
│  │  flights_flight     - Available flights                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │           Booking Tables (New - This Project)            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  user_booked_packages  - Package bookings + snapshots   │  │
│  │  user_booked_hotels    - Hotel bookings + snapshots     │  │
│  │  user_booked_flights   - Flight bookings + snapshots    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. User Registration Flow

```
User                Backend              Supabase
 │                    │                    │
 │──Register Request──>│                    │
 │  (email, password) │                    │
 │                    │                    │
 │                    │──Check if exists───>│
 │                    │<──Query Result──────│
 │                    │                    │
 │                    │──Hash Password─────>│
 │                    │  (bcrypt)          │
 │                    │                    │
 │                    │──Insert User────────>│
 │                    │<──User Created──────│
 │                    │                    │
 │                    │──Generate JWT───────│
 │                    │  (jsonwebtoken)    │
 │                    │                    │
 │<──Response─────────│                    │
 │ (user + token)     │                    │
```

### 2. Booking Package Flow

```
User                Backend                    Supabase
 │                    │                          │
 │──Book Package──────>│                          │
 │ (package_id +      │──Verify JWT Token────────│
 │  dates + JWT)      │                          │
 │                    │                          │
 │                    │──Get Package Details─────>│
 │                    │  FROM packages_package   │
 │                    │<──Package Data───────────│
 │                    │                          │
 │                    │──Create Booking──────────>│
 │                    │  INSERT INTO             │
 │                    │  user_booked_packages    │
 │                    │  (copy ALL package data) │
 │                    │<──Booking Created────────│
 │                    │                          │
 │<──Booking Confirmed─│                          │
 │ (booking details)  │                          │
```

### 3. View Bookings Flow

```
User                Backend                Supabase
 │                    │                      │
 │──Get My Bookings───>│                      │
 │ (type=package +    │──Verify JWT──────────│
 │  JWT token)        │                      │
 │                    │                      │
 │                    │──Query Bookings──────>│
 │                    │  FROM user_booked_   │
 │                    │  packages            │
 │                    │  WHERE user_id =     │
 │                    │  (from JWT)          │
 │                    │<──Bookings List──────│
 │                    │                      │
 │<──Bookings─────────│                      │
 │ (list of bookings) │                      │
```

## Database Schema Relationships

```
┌─────────────────┐
│     users       │ (Django - Existing)
├─────────────────┤
│ id (UUID) PK    │
│ email           │
│ password        │
│ first_name      │
│ last_name       │
│ phone           │
└────────┬────────┘
         │
         │ FK: user_id
         ├──────────────────────┬──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐  ┌──────────────────┐
│user_booked_      │   │user_booked_      │  │user_booked_      │
│packages          │   │hotels            │  │flights           │
├──────────────────┤   ├──────────────────┤  ├──────────────────┤
│id (UUID) PK      │   │id (UUID) PK      │  │id (UUID) PK      │
│user_id FK        │   │user_id FK        │  │user_id FK        │
│package_id        │   │hotel_id          │  │flight_id         │
│                  │   │                  │  │                  │
│SNAPSHOT:         │   │SNAPSHOT:         │  │SNAPSHOT:         │
│- title           │   │- name            │  │- flight_number   │
│- price           │   │- price_per_night │  │- airline         │
│- from_location   │   │- location        │  │- departure_time  │
│- to_location     │   │- amenities       │  │- arrival_time    │
│- transport_name  │   │- star            │  │- price           │
│- hotel_name      │   │- hotel_type      │  │- booking_class   │
│- guide_name      │   │                  │  │                  │
│                  │   │                  │  │                  │
│BOOKING DATA:     │   │BOOKING DATA:     │  │BOOKING DATA:     │
│- start_date      │   │- check_in_date   │  │- passengers      │
│- end_date        │   │- check_out_date  │  │- total_price     │
│- travelers       │   │- rooms           │  │- status          │
│- status          │   │- guests          │  │                  │
│                  │   │- total_price     │  │                  │
└──────────────────┘   └──────────────────┘  └──────────────────┘
         │                      │                      │
         │ FK (nullable)        │ FK (nullable)        │ FK (nullable)
         ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐  ┌──────────────────┐
│packages_package  │   │hotels_hotel      │  │flights_flight    │
│(Django)          │   │(Django)          │  │(Django)          │
├──────────────────┤   ├──────────────────┤  ├──────────────────┤
│id (bigint) PK    │   │id (varchar) PK   │  │id (varchar) PK   │
│title             │   │name              │  │flight_number     │
│price             │   │price             │  │current_price     │
│from_location     │   │location          │  │from_airport_id   │
│to_location       │   │amenities         │  │to_airport_id     │
│...               │   │...               │  │...               │
└──────────────────┘   └──────────────────┘  └──────────────────┘
```

## Authentication Flow

```
┌────────────────────────────────────────────────────────────┐
│                    Authentication                          │
└────────────────────────────────────────────────────────────┘

1. User Registers/Logs In
   ↓
2. Server generates JWT token containing:
   {
     userId: "uuid-here",
     email: "user@example.com",
     iat: timestamp,
     exp: timestamp + 7days
   }
   ↓
3. Token sent to client
   ↓
4. Client stores token (localStorage/cookie)
   ↓
5. Client includes token in subsequent requests:
   Authorization: Bearer eyJhbGc...
   ↓
6. Middleware verifies token:
   - Checks signature
   - Checks expiration
   - Extracts user info
   ↓
7. Request proceeds with req.user = { id, email }
```

## Booking System Logic

```
┌──────────────────────────────────────────────────────────────┐
│              Why Snapshot Strategy?                          │
└──────────────────────────────────────────────────────────────┘

❌ WITHOUT SNAPSHOT:
User books "Beach Package" for 15,000 BDT
Later, admin changes price to 20,000 BDT
User's booking shows: 20,000 BDT ← WRONG!

✅ WITH SNAPSHOT:
User books "Beach Package" for 15,000 BDT
Booking table stores: price = 15,000
Later, admin changes source to 20,000 BDT
User's booking still shows: 15,000 BDT ← CORRECT!

┌──────────────────────────────────────────────────────────────┐
│              Booking Creation Process                        │
└──────────────────────────────────────────────────────────────┘

1. User clicks "Book Now" on package
   ↓
2. Frontend sends: POST /api/bookings/package
   {
     package_id: 1,
     start_date: "2025-11-10",
     end_date: "2025-11-15",
     travelers: 2
   }
   ↓
3. Backend:
   a) Verify JWT token → get user_id
   b) Query packages_package WHERE id = 1
   c) Copy ALL fields from package
   d) INSERT into user_booked_packages:
      - user_id (from token)
      - package_id (reference)
      - title, price, location... (snapshot)
      - start_date, end_date (booking info)
      - status = 'confirmed'
   ↓
4. Return booking confirmation to user
```

## File Structure Explained

```
Wandernest-Backend/
│
├── config/
│   └── db.js                    # Supabase client setup
│                                  Returns: { supabase, testConnection }
│
├── controllers/                 # Business logic
│   ├── authController.js        # User auth: register(), login(), getProfile()
│   ├── packageController.js     # Package browsing: getAllPackages(), getPackageById()
│   ├── hotelController.js       # Hotel browsing: getAllHotels(), getHotelById()
│   ├── flightController.js      # Flight browsing: getAllFlights(), getFlightById()
│   ├── bookingController.js     # Bookings: book*(), getMyBookings(), cancel()
│   └── dashboardController.js   # Stats: getDashboardStats()
│
├── middleware/
│   └── auth.js                  # JWT verification middleware
│                                  Adds req.user = { id, email }
│
├── routes/                      # API endpoint definitions
│   ├── index.js                 # Main router (combines all routes)
│   ├── auth.js                  # POST /register, /login
│   ├── packages.js              # GET /packages, /packages/:id
│   ├── hotels.js                # GET /hotels, /hotels/:id
│   ├── flights.js               # GET /flights, /flights/:id
│   ├── bookings.js              # POST /package, /hotel, /flight
│   │                            # GET /?type=X, /:type/:id
│   │                            # DELETE /:id?type=X
│   └── dashboard.js             # GET /stats
│
├── handlers/                    # Legacy handlers (visa, guides, transport)
│   └── ...                      # (Not modified in this project)
│
├── app.js                       # Express server entry point
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── database_schema.sql          # Full database schema
│
└── Documentation/
    ├── README_BOOKING_SYSTEM.md     # Complete API docs
    ├── QUICKSTART.md                # 5-minute setup guide
    ├── IMPLEMENTATION_SUMMARY.md    # Implementation overview
    ├── ARCHITECTURE.md              # This file
    └── api-tests.http               # API test collection
```

## Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│         Example: Book a Package Request                     │
└─────────────────────────────────────────────────────────────┘

1. CLIENT REQUEST
   POST http://localhost:5000/api/bookings/package
   Headers:
     Content-Type: application/json
     Authorization: Bearer eyJhbGc...
   Body:
     {
       "package_id": 1,
       "start_date": "2025-11-10",
       "end_date": "2025-11-15",
       "travelers": 2
     }

2. EXPRESS SERVER (app.js)
   ↓
   app.use('/api', routes)  → routes/index.js
   ↓
   router.use('/bookings', bookingsRouter)  → routes/bookings.js
   ↓
   router.post('/package', ...)

3. MIDDLEWARE CHAIN
   ↓
   authenticateToken(req, res, next)
   - Extracts JWT from header
   - Verifies signature
   - Adds req.user = { id, email }
   ↓
   bookPackageValidation (express-validator)
   - Validates package_id is integer
   - Validates dates are ISO8601
   - Validates travelers >= 1
   ↓
   If validation fails → Return 400 error
   If valid → Continue

4. CONTROLLER (bookingController.js)
   ↓
   bookingController.bookPackage(req, res)
   - Extract data from req.body
   - Get user_id from req.user.id
   ↓
   Query Supabase:
     SELECT * FROM packages_package WHERE id = 1
   ↓
   Insert Booking:
     INSERT INTO user_booked_packages (...)
     VALUES (user_id, package_id, title, price, ...)
   ↓
   Return response

5. SERVER RESPONSE
   HTTP 201 Created
   {
     "success": true,
     "data": {
       "booking_id": "uuid-here",
       "message": "Package booked successfully",
       "booking": { ... }
     }
   }
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Measures                        │
└─────────────────────────────────────────────────────────────┘

Layer 1: HTTPS (Production)
  └─> Encrypts all traffic

Layer 2: CORS
  └─> Restricts which domains can access API

Layer 3: JWT Authentication
  ├─> Stateless authentication
  ├─> Token expiration (7 days)
  └─> Signature verification

Layer 4: Password Hashing (bcrypt)
  ├─> Salt rounds: 10
  ├─> Never stores plain passwords
  └─> One-way hashing

Layer 5: Input Validation (express-validator)
  ├─> Type checking
  ├─> Format validation
  └─> Sanitization

Layer 6: SQL Injection Protection
  └─> Supabase client uses parameterized queries

Layer 7: Authorization
  └─> User can only access their own bookings
      (verified via JWT user_id)
```

## Scalability Considerations

```
┌─────────────────────────────────────────────────────────────┐
│              Current Architecture Supports                  │
└─────────────────────────────────────────────────────────────┘

✅ Horizontal Scaling
   - Stateless JWT (no session storage)
   - Can run multiple server instances
   - Load balancer friendly

✅ Database Optimization
   - Indexes on user_id, status
   - Efficient queries (WHERE clauses)
   - Connection pooling via Supabase

✅ Caching Ready
   - GET endpoints can be cached
   - Package/hotel/flight lists
   - User bookings (with short TTL)

✅ API Versioning
   - Routes structured for versions
   - Currently: v2.0
   - Can add /api/v3/* without breaking v2

✅ Microservices Ready
   - Booking logic isolated
   - Can be separated to microservice
   - Clear API boundaries
```

---

**This architecture supports thousands of concurrent users and can be deployed to:**

- Vercel (Serverless)
- AWS (EC2, ECS, Lambda)
- Google Cloud (Cloud Run)
- Digital Ocean (App Platform)
- Heroku

**Database (Supabase) handles:**

- Auto-scaling
- Backups
- Replication
- Connection pooling
