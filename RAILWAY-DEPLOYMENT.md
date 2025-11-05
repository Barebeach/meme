# 🚂 RAILWAY DEPLOYMENT GUIDE

## **STEP 1: Prepare Your Code**

✅ **All localhost references are already configured!**

The app uses environment detection:
```javascript
const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;
```

This means:
- **Development:** Uses `http://localhost:3001`
- **Production:** Uses `https://memetalk.tv/` automatically

---

## **STEP 2: Create Railway Project**

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `memetalk-app`

---

## **STEP 3: Set Environment Variables**

In Railway dashboard, go to **Variables** tab and add:

### **🔑 REQUIRED Variables:**

```bash
# Node Environment
NODE_ENV=production

# OpenAI API Key (for AI chat/podcast)
OPENAI_API_KEY=sk-proj-your-key-here

# Cloudflare R2 Storage (for episodes/images)
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=memetalk-videos
R2_PUBLIC_URL=https://pub-2210718f3f20481b84992800d4ae8bd1.r2.dev
```

### **📝 OPTIONAL Variables:**

```bash
# Admin password (default: memetalk2025)
ADMIN_PASSWORD=memetalk2025

# Solana RPC (for Apply page token burns)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=48430da6-f3d3-485b-8260-9c034503b76b
```

---

## **STEP 4: Deploy**

Railway will automatically:
1. ✅ Install dependencies (`npm install`)
2. ✅ Build frontend (`npm run build`)
3. ✅ Start server (`npm start`)

**Your app will be live at:** `https://your-app.up.railway.app/`

---

## **STEP 5: Add Custom Domain**

1. In Railway dashboard, go to **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Add: `memetalk.tv`
4. Update your DNS records:

```
Type: CNAME
Name: @
Value: your-app.up.railway.app
```

**Wait 5-10 minutes for DNS propagation.**

---

## **STEP 6: Test Your Deployment**

Visit **https://memetalk.tv/** and test:

✅ Home page loads  
✅ Admin panel works (`/admin`)  
✅ Apply page works (`/apply`)  
✅ Schedule page works (`/schedule`)  
✅ Episodes display correctly  
✅ Live chat connects  
✅ OBS stream works (`/obs`)  

---

## **🔥 IMPORTANT NOTES:**

### **Port Configuration:**
- Railway automatically sets `PORT` environment variable
- Server uses: `const PORT = process.env.PORT || 3001;`
- ✅ **No changes needed!**

### **CORS Configuration:**
- Already set to allow all origins in production
- Socket.IO configured for production

### **File Storage:**
- Local episodes stored in `public/episodes/`
- Uploaded to R2 for CDN delivery
- Thumbnails auto-generated

### **FFmpeg:**
- Already included via `@ffmpeg-installer/ffmpeg`
- ✅ Works on Railway out of the box

---

## **🐛 Troubleshooting:**

### **Issue: App doesn't start**
**Solution:** Check Railway logs for errors. Usually missing environment variables.

### **Issue: Socket.IO not connecting**
**Solution:** Make sure WebSocket support is enabled in Railway (it is by default).

### **Issue: Videos not loading**
**Solution:** 
1. Check R2 bucket is public
2. Verify R2_PUBLIC_URL is correct
3. Test R2 URLs directly in browser

### **Issue: OpenAI errors**
**Solution:** 
1. Verify OPENAI_API_KEY is set
2. Check API key has credits
3. Check OpenAI API status

---

## **📊 Monitoring:**

Railway provides:
- ✅ Real-time logs
- ✅ Metrics (CPU, Memory, Network)
- ✅ Deployment history
- ✅ Automatic HTTPS

---

## **🚀 READY TO DEPLOY?**

1. Push your code to GitHub
2. Create Railway project
3. Set environment variables
4. Deploy!
5. Add custom domain

**Your live podcast platform will be running at https://memetalk.tv/ in minutes!** 🎉

