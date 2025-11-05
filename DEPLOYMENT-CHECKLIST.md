# ✅ RAILWAY DEPLOYMENT CHECKLIST

## **BEFORE DEPLOYMENT:**

### **1. Code Preparation**
- [x] ✅ All localhost references use environment detection
- [x] ✅ Server uses `process.env.PORT` for Railway
- [x] ✅ CORS configured for production domain
- [x] ✅ Frontend API calls use `window.location.origin` in production
- [x] ✅ `railway.json` config file created
- [x] ✅ `Procfile` created
- [x] ✅ Build scripts configured in `package.json`

### **2. Environment Variables Needed**
```bash
NODE_ENV=production
OPENAI_API_KEY=sk-proj-...
R2_ENDPOINT=https://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=memetalk-videos
R2_PUBLIC_URL=https://pub-2210718f3f20481b84992800d4ae8bd1.r2.dev
```

### **3. Test Locally First**
```bash
# Build frontend
npm run build

# Start in production mode
NODE_ENV=production npm start

# Visit: http://localhost:3001
```

---

## **DEPLOYMENT STEPS:**

### **Step 1: Push to GitHub**
```bash
git add .
git commit -m "Railway deployment ready"
git push origin main
```

### **Step 2: Create Railway Project**
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

### **Step 3: Configure Railway**
1. Go to **Settings** → **Environment**
2. Set `NODE_ENV=production`
3. Add all other environment variables
4. Save changes

### **Step 4: Deploy**
Railway will automatically:
1. Clone your repo
2. Run `npm run railway:build`
3. Start with `npm start`
4. Assign a URL

### **Step 5: Add Custom Domain**
1. **Settings** → **Domains** → **Custom Domain**
2. Add: `memetalk.tv`
3. Update DNS:
   ```
   Type: CNAME
   Name: @
   Value: your-app.up.railway.app
   ```

---

## **POST-DEPLOYMENT TESTING:**

### **✅ Frontend Pages:**
- [ ] Home page loads (`https://memetalk.tv/`)
- [ ] Admin panel works (`/admin`)
- [ ] Apply page works (`/apply`)
- [ ] Schedule page works (`/schedule`)
- [ ] About page works (`/about`)
- [ ] Episodes page works (`/episodes`)

### **✅ Core Features:**
- [ ] Live chat connects
- [ ] Can set username
- [ ] Messages send/receive
- [ ] Question system works
- [ ] Video player displays
- [ ] Episodes load from R2

### **✅ Admin Features:**
- [ ] Admin login works
- [ ] Can start show
- [ ] Countdown works
- [ ] Recording works
- [ ] Episodes save to R2
- [ ] Broadcast controls work

### **✅ Apply Page:**
- [ ] Wallet connects
- [ ] Schedule loads
- [ ] Can select date/time
- [ ] Token burn works
- [ ] Application submits

### **✅ OBS Stream:**
- [ ] `/obs` route works
- [ ] Video displays
- [ ] Audio plays
- [ ] Questions show
- [ ] Syncs with main page

---

## **MONITORING:**

### **Railway Dashboard:**
- View real-time logs
- Monitor CPU/Memory
- Check deployments
- View metrics

### **Check Logs For:**
```
✅ Socket.IO Client Connected
✅ FFmpeg path: ...
✅ BACKEND API SERVER: http://...
✅ Mr Cock is ready to host!
✅ Pepe is ready to be interviewed!
✅ Episode recording: ENABLED
```

---

## **ROLLBACK PLAN:**

If something goes wrong:

### **Option 1: Redeploy Previous Version**
1. Railway → **Deployments**
2. Find working deployment
3. Click **"Redeploy"**

### **Option 2: Fix and Redeploy**
1. Fix issue locally
2. `git commit && git push`
3. Railway auto-deploys

### **Option 3: Environment Variables**
1. Check all env vars are set
2. Verify R2 credentials
3. Test OpenAI API key

---

## **🎉 SUCCESS CRITERIA:**

Your deployment is successful when:

✅ Site loads at https://memetalk.tv/  
✅ All pages work  
✅ Chat connects and works  
✅ Admin can start shows  
✅ Episodes record and save  
✅ OBS stream works  
✅ Apply page processes applications  
✅ No errors in Railway logs  

---

## **🚨 EMERGENCY CONTACTS:**

- **Railway Support:** https://railway.app/help
- **OpenAI Status:** https://status.openai.com/
- **Cloudflare R2 Status:** https://www.cloudflarestatus.com/

---

## **📚 RESOURCES:**

- [Railway Docs](https://docs.railway.app/)
- [RAILWAY-DEPLOYMENT.md](./RAILWAY-DEPLOYMENT.md)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

---

**🚀 READY TO DEPLOY? LET'S GO!**

