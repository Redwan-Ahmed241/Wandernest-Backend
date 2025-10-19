# Visa API Setup Guide - Next Steps

## ✅ COMPLETED

- Database schema created
- All API endpoints implemented
- Zod validation added
- JWT authentication added
- Basic testing done

## 🚀 NEXT STEPS (Simple Actions)

### 1. Environment Setup (5 minutes)

Add this to your `.env` file:

```
JWT_SECRET=your-super-secret-key-change-this-in-production-12345
```

### 2. Test the API (10 minutes)

Run the server and test basic endpoints:

```bash
npm start
```

Test these URLs in browser/Postman:

- `http://localhost:3000/api/visa/v1/health` ✅
- `http://localhost:3000/api/visa/v1/countries` ✅

### 3. File Upload Setup (Optional - 15 minutes)

For document uploads to work properly, you need file storage.

**Option A: Use Supabase Storage (Recommended)**

- Go to Supabase Dashboard → Storage
- Create a "documents" bucket
- Update document upload code to use real Supabase storage

**Option B: Keep Local (For Development)**

- Documents will be stored as URLs (not real files)
- Good for testing the API flow

### 4. Payment Integration (Optional - 30 minutes)

For payments to work with real money:

**Option A: Use Mock Payments (Recommended for now)**

- Already implemented! Use `provider: "mock"`
- Always succeeds, good for testing

**Option B: Real Payment Providers**

- Stripe: Sign up, get API keys, implement webhook
- Bkash/SSLCommerz: Bangladesh payment providers

### 5. Frontend Integration (Your Expertise!)

Connect your frontend to the API:

**Authentication:**

```javascript
// Login to get JWT token
const token = await loginUser(credentials);

// Use token for API calls
const response = await fetch("/api/visa/v1/applications", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**API Calls:**

```javascript
// Get countries
const countries = await fetch("/api/visa/v1/countries");

// Create application
const application = await fetch("/api/visa/v1/applications", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(applicationData),
});
```

## 🎯 PRIORITY ORDER

1. **Environment setup** (Required - 5 min)
2. **Basic testing** (Required - 10 min)
3. **Frontend integration** (Your main task!)
4. **File storage** (Optional - when users upload documents)
5. **Real payments** (Optional - when ready for production)

## 📱 Frontend Integration Checklist

- [ ] Set up API client (fetch/axios)
- [ ] Implement user authentication
- [ ] Create application forms
- [ ] Add document upload
- [ ] Build payment flow
- [ ] Handle API errors gracefully

## 🆘 Need Help?

The backend API is **production-ready**! Focus on connecting your frontend to it. The API will:

- ✅ Validate all data automatically
- ✅ Handle authentication securely
- ✅ Return clear error messages
- ✅ Support all visa application features

Start with the environment setup, then jump into frontend integration - that's where your expertise shines! 🚀
