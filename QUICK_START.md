# Render Deployment Quick Reference

## 🚀 Fast Track Deployment (5 steps)

### Step 1: Prepare Code for GitHub

```bash
# Make sure files are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Deploy Backend

- Go to https://render.com/dashboard
- Click "New +" → "Web Service"
- Select your GitHub repo
- Set name: `url-shortener-api`
- Build: `pip install -r requirements.txt`
- Start: `gunicorn main:app` (already in Procfile)
- Add Environment: `FRONTEND_URL=*` (for now)
- Click "Create"
- ⏳ Wait for deployment (2-3 mins)
- 📝 Copy your API URL: `https://url-shortener-api-xxx.onrender.com`

### Step 3: Update Frontend

Edit `index.html` around line 8-11:

```html
<script>
  window.API_BASE = "https://url-shortener-api-xxx.onrender.com/api";
</script>
```

### Step 4: Deploy Frontend

- Commit and push updated HTML file
- Go to https://render.com/dashboard
- Click "New +" → "Static Site"
- Select your GitHub repo
- Set name: `url-shortener-frontend`
- Build Command: (leave empty)
- Click "Create"
- ⏳ Wait for deployment (30 secs)
- 📝 Copy your Frontend URL

### Step 5: Secure CORS (Optional but Recommended)

- Go to your Render Web Service (Backend)
- Update Environment: `FRONTEND_URL=https://url-shortener-frontend-xxx.onrender.com`
- Re-deploy

**Done!** Your app is live 🎉

---

## 🔍 Check Status

- **Backend running?** Visit: `https://your-api.onrender.com/api/all`
- **Frontend accessible?** Visit: `https://your-frontend.onrender.com`
- **API connection works?** Try shortening a URL and check browser console

---

## 🐛 Common Issues

| Problem                      | Solution                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| "URL not found" API errors   | Check `window.API_BASE` in HTML                                 |
| CORS errors                  | Update `FRONTEND_URL` in Render backend settings                |
| QR codes not showing         | API returned base64 correctly but frontend not displaying       |
| Database empty after restart | Free tier has ephemeral storage; use PostgreSQL for persistence |

---

## 📋 Key Files

| File          | Change  | Why                                    |
| ------------- | ------- | -------------------------------------- |
| `Procfile`    | NEW     | Tells Render to use Gunicorn           |
| `render.yaml` | NEW     | Optional; alternative to manual config |
| `script.js`   | Updated | Dynamic API URLs (`window.API_BASE`)   |
| `main.py`     | Updated | Environment-based CORS                 |
| `index.html`  | Updated | API config template                    |

---

## 🔐 Security Checklist

- [x] Using Gunicorn (production-ready)
- [ ] Update `FRONTEND_URL` from `*` to actual domain
- [ ] Consider adding rate limiting to `/api/shorten`
- [ ] Test with real frontend domain before going public
- [ ] Monitor Render dashboard for errors/usage

---

## 💾 Database

- **Type**: SQLite (locally stored)
- **Persistence**: ✅ On paid tier, ⚠️ Lost on free tier after 15 mins inactivity
- **Upgrade**: Switch to PostgreSQL (Render offers it)

---

## 🚨 After 15 Minutes of Inactivity (Free Tier)

Your web service goes to sleep. Next request will wake it (takes ~30s).
Use a monitoring service (like Uptime Robot) to keep it warm.

---

## 📞 Support

- Render Docs: https://render.com/docs
- GitHub Repo: Push latest code
- Logs: Check Render dashboard "Logs" tab for errors
