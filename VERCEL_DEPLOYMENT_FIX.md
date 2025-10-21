# 🚀 Vercel Deployment Fix Guide

## ✅ What Was Fixed

1. **CORS Configuration** - Now allows localhost:1241 and configurable origins
2. **Database Connection** - Won't crash on missing credentials in production
3. **Health Check Endpoint** - Added `/health` to debug deployments

---

## 🔧 Steps to Fix Your Vercel Deployment

### Step 1: Add Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables

Add these variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret_here
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:1241
NODE_ENV=production
```

**Important:** Use your **actual values** from your local `.env` file!

### Step 2: Redeploy

After adding environment variables:

1. Go to Deployments tab
2. Click on the failed deployment
3. Click "Redeploy"

OR push a new commit:

```bash
git add .
git commit -m "Fix Vercel deployment with proper env handling"
git push
```

### Step 3: Test Your Deployment

Once deployed, test these endpoints:

```bash
# Health check (should work immediately)
curl https://wandernest-backend.vercel.app/health

# API root
curl https://wandernest-backend.vercel.app/api

# Test endpoint
curl https://wandernest-backend.vercel.app/test
```

---

## 🐛 Common Issues & Solutions

### Issue: Still getting 500 error

**Solution:** Check Vercel Runtime Logs

1. Go to Deployments → Click deployment → Runtime Logs
2. Look for the actual error message
3. Usually it's missing environment variables

### Issue: CORS errors from frontend

**Solution:** Add your frontend URL to `ALLOWED_ORIGINS`

```env
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:1241,http://localhost:3000
```

### Issue: "Missing Supabase credentials"

**Solution:** Double-check environment variables in Vercel:

- Variable names must match exactly: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- No extra spaces
- Values must be the full URL/key

### Issue: JWT authentication not working

**Solution:** Ensure `JWT_SECRET` in Vercel matches your Django backend's secret

---

## 📋 Deployment Checklist

- [ ] Added `SUPABASE_URL` to Vercel env vars
- [ ] Added `SUPABASE_SERVICE_KEY` to Vercel env vars
- [ ] Added `JWT_SECRET` to Vercel env vars
- [ ] Added `ALLOWED_ORIGINS` with your frontend URLs
- [ ] Redeployed on Vercel
- [ ] Tested `/health` endpoint
- [ ] Tested `/api` endpoint
- [ ] Tested booking endpoints with token

---

## 🔍 Debug Commands

```bash
# Check if deployment is live
curl https://wandernest-backend.vercel.app/health

# Test with your domain
curl https://wandernest-backend.vercel.app/api

# Test booking endpoint (need token)
curl https://wandernest-backend.vercel.app/api/packages
```

---

## ✨ What's Different Now

### Before:

- App crashed on missing env vars → 500 error
- CORS only allowed all origins or blocked all

### After:

- App handles missing env vars gracefully
- CORS allows specific origins (including localhost:1241)
- Health check endpoint for debugging
- Better error messages in logs

---

## 🎯 Next Steps After Deployment Works

1. Test all API endpoints
2. Update your frontend to use the Vercel URL
3. Test CORS from your frontend
4. Monitor Vercel logs for any issues

---

**Your CORS is configured! ✅**  
**Just add the environment variables in Vercel and redeploy!**
