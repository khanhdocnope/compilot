# Deploying URL Shortener to Render

This guide explains how to deploy the URL Shortener application to Render as separate backend and frontend services.

## Architecture

- **Backend (Web Service)**: Flask API with SQLite database
- **Frontend (Static Site)**: HTML/CSS/JavaScript static files
- **Communication**: CORS-enabled API calls from frontend to backend

## Step 1: Deploy Backend API to Render (Web Service)

### Prerequisites

- Push your code to GitHub
- Create a Render account (https://render.com)

### Steps

1. **Create a new Web Service**
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the branch containing your code

2. **Configure the Service**
   - **Name**: `url-shortener-api` (or your preferred name)
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn main:app`
   - **Plan**: Free (or paid depending on your needs)

3. **Set Environment Variables**
   - In the "Environment" section, add:
     - **Key**: `FRONTEND_URL`
     - **Value**: `https://your-frontend-domain.onrender.com` (leave as `*` for testing)

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your API
   - Your API will be available at: `https://your-app-name.onrender.com`

## Step 2: Update Frontend Configuration

### Option A: Frontend and API on Same Domain (Simpler)

If you're deploying frontend files to a URL path on the same Render service:

1. The `API_BASE = "/api"` in script.js will automatically work
2. Requests will go to `/api/shorten`, `/api/all`, etc.

### Option B: Frontend on Different Domain (Recommended)

If you're deploying frontend as a separate Static Site:

1. Add this to your `index.html` **before loading script.js**:

   ```html
   <script>
     // Set API base URL for separate domain deployment
     window.API_BASE = "https://your-api-name.onrender.com/api";
   </script>
   ```

2. Replace `your-api-name.onrender.com` with your actual API domain from Step 1

## Step 3: Deploy Frontend to Render (Static Site)

### Steps

1. **Create a new Static Site**
   - Go to https://render.com/dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure the Service**
   - **Name**: `url-shortener-frontend` (or your preferred name)
   - **Root Directory**: `.` (current directory, since HTML file is at root)
   - **Build Command**: Leave empty (if your files are already ready)

3. **Deploy**
   - Click "Create Static Site"
   - Your frontend will be available at: `https://your-frontend-name.onrender.com`

## Updating Frontend API Configuration

After both services are deployed:

1. Update your `index.html` with the correct API URL:

   ```html
   <script>
     window.API_BASE = "https://your-api-name.onrender.com/api";
   </script>
   ```

2. Commit and push to GitHub
3. Render will automatically redeploy the static site

## Troubleshooting

### CORS Errors

If you see CORS-related errors in the browser console:

1. Update `FRONTEND_URL` environment variable in the Web Service:
   - Go to your API service settings
   - Update `FRONTEND_URL` to your actual frontend domain
   - Re-deploy

2. Or temporarily set `FRONTEND_URL` to `*` for testing (less secure)

### API Connection Issues

- Check that `window.API_BASE` in your frontend matches your actual API domain
- Verify the API is running: visit `https://your-api-domain.onrender.com/api/all`
- Check browser console for errors

### Database Issues

- The SQLite database (`urls.db`) will be created automatically
- On Render's free tier, the database persists as long as the service is running
- For production, consider upgrading to a paid tier or using a PostgreSQL database

## Local Development

To test locally before deploying:

1. Set `window.API_BASE` to `http://localhost:5000/api` in your script
2. Run Flask: `python main.py`
3. Open `index.html` in your browser

## Environment Variables Reference

| Variable       | Description                              | Example                              |
| -------------- | ---------------------------------------- | ------------------------------------ |
| `FRONTEND_URL` | Domain of frontend for CORS verification | `https://your-frontend.onrender.com` |
| `PORT`         | Port for Flask app (default 5000)        | `5000`                               |
| `DATABASE`     | Path to SQLite database                  | `urls.db`                            |

## Files Structure for Render

```
/
├── main.py                 # Flask backend
├── script.js               # Frontend logic
├── index.html              # Frontend HTML
├── style.css               # Frontend styling
├── requirements.txt        # Python dependencies
├── Procfile                # Render deployment config
├── render.yaml             # Optional: Render config
└── static/                 # Static files (if needed)
    └── qrcodes/
```

## Security Notes

- ✅ Using Gunicorn instead of Flask dev server
- ✅ CORS is configurable (not hardcoded to `*`)
- ⚠️ SQLite is not ideal for production with multiple instances
- ⚠️ Add authentication if dealing with sensitive data
- ⚠️ Use HTTPS (Render provides this automatically)

## Next Steps

- Consider migrating from SQLite to PostgreSQL for better reliability
- Add user authentication if needed
- Implement rate limiting for API endpoints
- Monitor usage and costs on Render dashboard
