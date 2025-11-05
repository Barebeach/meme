# MemeTalk.TV Development Setup

## Port Configuration

### Development Mode (Current Setup)
- **Frontend**: http://localhost:5173 (Vite dev server with hot reload) ✅ **USE THIS**
- **Backend API**: http://localhost:3001 (Express server)
- **Port 3000**: FREE for your other application

### Production Mode
- **Full Stack**: http://localhost:3001 (serves both API and built frontend)

### ✅ Fixed Issues
- All frontend pages now connect to port 3001 (Home, Admin, Apply, Schedule)
- Socket.IO connections updated to use port 3001
- Video transitions now use smooth crossfade (no black screens)

## Starting the Servers

```bash
# Terminal 1 - Backend API
npm run server

# Terminal 2 - Frontend Dev Server (with hot reload)
npm run dev
```

## Important Notes

1. **Always use port 5173 for development** - It has hot reload and latest changes
2. **Port 3001** only serves the API in development mode (no frontend)
3. **Port 3000** is kept free for your other application
4. Video transitions are now smooth (0.4s crossfade) - no more black screens!

## Video Transition Fix

The video player now uses a dual-video crossfade system:
- Two video elements overlay each other
- When emotion changes, the new video fades in while the old one fades out
- 400ms smooth transition (no visible switching or black screens)
- Users won't notice when videos change between emotions

## Building for Production

```bash
npm run build
NODE_ENV=production npm start
```

In production, port 3001 serves both the API and the frontend.

