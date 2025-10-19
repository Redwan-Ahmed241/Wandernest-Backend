# WanderNest Backend - Complete Booking System API

A comprehensive Express.js backend for WanderNest travel application with Supabase/PostgreSQL integration.

## 🚀 Features

- ✅ User authentication (Register/Login with JWT)
- ✅ Browse packages, hotels, and flights
- ✅ Book packages, hotels, and flights
- ✅ View user booking history
- ✅ Cancel bookings
- ✅ Dashboard statistics
- ✅ PostgreSQL/Supabase database
- ✅ RESTful API design
- ✅ Input validation
- ✅ Error handling

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js (v14 or higher)
- A Supabase account and project
- PostgreSQL database (via Supabase)

## 🛠️ Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

**Get Supabase Credentials:**

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy `URL`, `anon/public` key, and `service_role` key

**Generate JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Set Up Database Tables

Go to your Supabase SQL Editor and run the SQL commands in `database_schema.sql`:

```sql
-- Run the booking tables creation scripts:
-- 1. user_booked_packages
-- 2. user_booked_hotels
-- 3. user_booked_flights
```

Open `database_schema.sql` and execute the booking system tables section.

### Step 4: Start the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server will run on `http://localhost:5000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+880123456789"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/login`

Login existing user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/profile`

Get current user profile (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

---

### Browse Available Items

#### GET `/api/packages`

Get all available packages.

#### GET `/api/packages/:id`

Get package by ID.

#### GET `/api/hotels`

Get all available hotels (excludes test data).

#### GET `/api/hotels/:id`

Get hotel by ID.

#### GET `/api/flights`

Get all available flights (active with available seats).

#### GET `/api/flights/:id`

Get flight by ID.

---

### Booking Endpoints (Protected)

All booking endpoints require authentication header:

```
Authorization: Bearer <token>
```

#### POST `/api/bookings/package`

Book a package.

**Request:**

```json
{
  "package_id": 1,
  "start_date": "2025-11-10",
  "end_date": "2025-11-15",
  "travelers": 2
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "booking_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Package booked successfully",
    "booking": {
      /* booking details */
    }
  }
}
```

#### POST `/api/bookings/hotel`

Book a hotel.

**Request:**

```json
{
  "hotel_id": "hotel_001",
  "check_in_date": "2025-11-05",
  "check_out_date": "2025-11-08",
  "rooms": 1,
  "guests": 2
}
```

#### POST `/api/bookings/flight`

Book a flight.

**Request:**

```json
{
  "flight_id": "flight_001",
  "departure_time": "2026-01-15T08:00:00Z",
  "arrival_time": "2026-01-15T12:30:00Z",
  "passengers": 2
}
```

#### GET `/api/bookings?type=package`

Get user's package bookings.

Query parameters:

- `type`: `package` | `hotel` | `flight`

#### GET `/api/bookings/package/:id`

Get specific package booking details.

#### GET `/api/bookings/hotel/:id`

Get specific hotel booking details.

#### GET `/api/bookings/flight/:id`

Get specific flight booking details.

#### DELETE `/api/bookings/:id?type=package`

Cancel a booking (soft delete - updates status to 'cancelled').

Query parameters:

- `type`: `package` | `hotel` | `flight`

---

### Dashboard

#### GET `/api/dashboard/stats`

Get user booking statistics (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": {
    "totalBookings": 5,
    "packageBookings": 2,
    "hotelBookings": 2,
    "flightBookings": 1,
    "upcomingTrips": 3,
    "completedTrips": 1,
    "cancelledBookings": 1,
    "totalSpent": 85500,
    "averageSpentPerTrip": 17100
  }
}
```

---

## 🔐 Database Schema

### New Booking Tables

The system creates 3 new tables:

1. **user_booked_packages** - Stores package bookings with snapshot data
2. **user_booked_hotels** - Stores hotel bookings with snapshot data
3. **user_booked_flights** - Stores flight bookings with snapshot data

### Key Features:

- UUID primary keys
- Snapshot of item details at booking time (price, name, etc.)
- Foreign keys to users table
- Soft delete (status field)
- Timestamps (created_at, updated_at, booking_date)

---

## 📁 Project Structure

```
Wandernest-Backend/
├── config/
│   └── db.js                    # Supabase client configuration
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── packageController.js     # Package browsing
│   ├── hotelController.js       # Hotel browsing
│   ├── flightController.js      # Flight browsing
│   ├── bookingController.js     # Booking operations
│   └── dashboardController.js   # User statistics
├── middleware/
│   └── auth.js                  # JWT authentication middleware
├── routes/
│   ├── index.js                 # Main router
│   ├── auth.js                  # Auth routes
│   ├── packages.js              # Package routes
│   ├── hotels.js                # Hotel routes
│   ├── flights.js               # Flight routes
│   ├── bookings.js              # Booking routes
│   └── dashboard.js             # Dashboard routes
├── handlers/                     # Legacy handlers (visa, guides, etc.)
├── .env.example                 # Environment template
├── .env                         # Your actual environment (DO NOT COMMIT)
├── database_schema.sql          # Database schema
├── app.js                       # Express app entry point
├── package.json                 # Dependencies
└── README_BOOKING_SYSTEM.md     # This file
```

## 🧪 Testing the API

### Using cURL

**Register:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","first_name":"Test","last_name":"User"}'
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Get Packages:**

```bash
curl http://localhost:5000/api/packages
```

**Book Package (with token):**

```bash
curl -X POST http://localhost:5000/api/bookings/package \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"package_id":1,"start_date":"2025-11-10","end_date":"2025-11-15","travelers":2}'
```

### Using Postman

1. Import endpoints from the documentation above
2. Create an environment variable for `token`
3. Use `{{token}}` in Authorization headers

---

## 🔄 Complete Booking Flow

1. **User Registration/Login** → Get JWT token
2. **Browse Items** → GET /api/packages, /api/hotels, /api/flights
3. **View Details** → GET /api/packages/:id
4. **Book Item** → POST /api/bookings/package (with token)
5. **View Bookings** → GET /api/bookings?type=package
6. **View Booking Details** → GET /api/bookings/package/:id
7. **Cancel Booking** → DELETE /api/bookings/:id?type=package
8. **Check Stats** → GET /api/dashboard/stats

---

## ⚠️ Important Notes

### Data Snapshot Strategy

When a user books an item (package/hotel/flight), the system:

1. Fetches current data from source table (packages_package, hotels_hotel, flights_flight)
2. Creates a **snapshot copy** in booking table (user_booked_packages, etc.)
3. This preserves the booking details even if the original item changes or is deleted

### Authentication

- All booking and dashboard endpoints require JWT token
- Token expires in 7 days (configurable via JWT_EXPIRES_IN)
- Include token in header: `Authorization: Bearer <token>`

### Foreign Keys

- Booking tables reference `users.id` (UUID)
- Foreign keys use `ON DELETE CASCADE` for users
- Foreign keys use `ON DELETE SET NULL` for source items

---

## 🐛 Troubleshooting

### "Supabase connection failed"

- Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
- Ensure Supabase project is active
- Verify network connectivity

### "Invalid token" errors

- Token may be expired (re-login)
- Check JWT_SECRET matches between login and verification
- Ensure Authorization header format: `Bearer <token>`

### "Package/Hotel/Flight not found"

- Verify item exists in source table
- Check ID format (integer for packages, string for hotels/flights)
- Ensure test_data=false for hotels, is_active=true for flights

---

## 📦 Dependencies

```json
{
  "@supabase/supabase-js": "^2.74.0",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.18.2",
  "express-validator": "^7.0.1",
  "jsonwebtoken": "^9.0.2"
}
```

---

## 🚀 Deployment

### Vercel

Already configured with `vercel.json`. Just push to GitHub and connect to Vercel.

### Environment Variables on Vercel

Add these in Vercel dashboard:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `NODE_ENV=production`

---

## 📄 License

MIT

---

## 👥 Support

For issues or questions:

1. Check this README
2. Review API documentation
3. Check Supabase logs
4. Review server logs: `npm run dev`

---

**Built with ❤️ for WanderNest Travel Platform**
