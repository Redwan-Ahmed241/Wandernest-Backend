# 🚀 Quick Start Guide - WanderNest Booking System

## ⚡ Step-by-Step Setup (5 minutes)

### 1️⃣ Run SQL Commands in Supabase

1. Open Supabase: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Open `database_schema.sql` from this project
5. **Copy and run** the booking tables section:
   - `user_booked_packages` table
   - `user_booked_hotels` table
   - `user_booked_flights` table
6. Click **Run** - you should see "Success" messages

### 2️⃣ Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file:

```env
PORT=5000
NODE_ENV=development

# Get these from: https://app.supabase.com/project/_/settings/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_secret_here
JWT_EXPIRES_IN=7d
```

### 3️⃣ Install & Run

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

You should see:

```
✅ Supabase connection successful
Server is running on http://localhost:5000
```

### 4️⃣ Test the API

**Open browser:** http://localhost:5000/api

You should see:

```json
{
  "success": true,
  "message": "Welcome to Wandernest API!",
  "version": "2.0",
  "endpoints": { ... }
}
```

---

## 🧪 Quick API Tests

### Test 1: Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","first_name":"Test"}'
```

**Copy the token from response!**

### Test 2: Get Packages

```bash
curl http://localhost:5000/api/packages
```

### Test 3: Book a Package (replace TOKEN)

```bash
curl -X POST http://localhost:5000/api/bookings/package \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"package_id":1,"start_date":"2025-11-10","end_date":"2025-11-15","travelers":2}'
```

### Test 4: View My Bookings

```bash
curl http://localhost:5000/api/bookings?type=package \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 Checklist

- [ ] Created 3 booking tables in Supabase
- [ ] Configured .env file with Supabase credentials
- [ ] Configured .env file with JWT_SECRET
- [ ] Ran `npm install`
- [ ] Started server with `npm run dev`
- [ ] Server shows "Supabase connection successful"
- [ ] Tested registration endpoint
- [ ] Received JWT token
- [ ] Tested booking endpoint with token

---

## ✅ All Working?

Your booking system is ready!

**Next steps:**

- Read full API docs in `README_BOOKING_SYSTEM.md`
- Test all endpoints with Postman
- Connect your frontend

---

## ❌ Something Wrong?

### Server won't start

- Check `.env` file exists
- Verify Supabase credentials are correct
- Run `npm install` again

### "Supabase connection failed"

- Check SUPABASE_URL format: https://xxx.supabase.co
- Use SERVICE_KEY not ANON_KEY in backend
- Verify project is active on Supabase

### "Table doesn't exist"

- Run the SQL commands in Supabase SQL Editor
- Check table names: `user_booked_packages`, etc.
- Verify you're in the correct Supabase project

### "Invalid token"

- JWT_SECRET must be the same that was used to create token
- Token format: `Bearer <token>`
- Re-login to get fresh token

---

**Need help?** Check `README_BOOKING_SYSTEM.md` for detailed documentation.
