# 🔗 URL Shortener Project

A full-stack URL shortening application with a modern web interface and Flask backend.

## Features ✨

### Core Features
- **URL Shortening**: Convert long URLs into short, shareable links
- **Base62 Encoding**: Professional-grade short code generation
- **Click Tracking**: Monitor how many times each link is clicked
- **Custom Aliases**: Choose your own custom short codes

### Advanced Features
- **Link Expiration**: Set time limits on shortened URLs (1 hour to 30 days)
- **Analytics Dashboard**: View all created links and their statistics
- **Real-time Stats**: Track creation date and click counts
- **Responsive Design**: Beautiful UI that works on all devices

## Project Structure 📁

```
gitcompilot/
├── main.py              # Flask backend server
├── index.html           # Frontend interface
├── script.js            # JavaScript logic
├── style.css            # Styling
├── requirements.txt     # Python dependencies
├── urls.db              # SQLite database (created on first run)
└── README.md            # This file
```

## How It Works 🔧

### 1. **URL Shortening Process**
```
User Input: "https://example.com/very/long/path?param=value"
         ↓
    Backend Processing (Base62 Encoding)
         ↓
    Database Storage: {"aB7k2": "https://..."}
         ↓
Output: "http://localhost:5000/aB7k2"
```

### 2. **Database Schema**
```
urls table:
├── id (INTEGER, Primary Key)
├── original_url (TEXT)
├── short_id (TEXT, Unique)
├── custom_alias (TEXT, Unique, Optional)
├── created_at (TIMESTAMP)
├── expires_at (TIMESTAMP, Optional)
└── clicks (INTEGER)
```

### 3. **Base62 Encoding**
The system uses Base62 encoding (0-9, a-z, A-Z) to convert sequential IDs:
- ID 1 → "1"
- ID 62 → "10"  
- ID 3844 → "zz"
- Collision-free and URL-friendly

## Getting Started 🚀

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Installation

1. **Clone or download the project**
```bash
cd gitcompilot
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the Flask server**
```bash
python main.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

4. **Open in your browser**
Navigate to: `http://localhost:5000`

## Usage 📖

### Basic Shortening
1. Paste a long URL in the input field
2. Click "Shorten URL"
3. Copy the generated short link
4. Share it!

### Advanced Options
1. Click "⚙️ Advanced Options"
2. **Custom Alias**: Enter a custom short code (e.g., "my-project")
3. **Link Expiration**: Choose when the link should expire
4. Submit

### View Statistics
- **Recent Links**: View all created links on the dashboard
- **Click Counts**: See how many times each link has been clicked
- **Creation Date**: Track when each link was created
- **Expiration**: Check when links will expire

## API Endpoints 🔌

### POST /api/shorten
Create a shortened URL

**Request:**
```json
{
  "url": "https://example.com/path",
  "custom_alias": "my-link",
  "expiration_hours": 24
}
```

**Response:**
```json
{
  "short_id": "my-link",
  "original_url": "https://example.com/path",
  "short_url": "http://localhost:5000/my-link"
}
```

### GET /{short_id}
Redirect to original URL (tracks clicks)

### GET /api/stats/{short_id}
Get statistics for a shortened URL

**Response:**
```json
{
  "original_url": "https://...",
  "created_at": "2024-03-06 10:30:00",
  "clicks": 42,
  "expires_at": "2024-03-07 10:30:00"
}
```

### GET /api/all
Get all shortened URLs

## Technical Stack 💻

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite3
- **CORS**: Flask-CORS (for cross-origin requests)

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern responsive design with gradients
- **Vanilla JavaScript**: No frameworks needed!

### Database
- **Lightweight**: SQLite - no setup required
- **Local Storage**: File-based, perfect for development
- **Scalable**: Easy migration to PostgreSQL/MySQL

## Expanding the Project 🌱

### Add QR Code Generation
```python
# Install: pip install qrcode pillow
from qrcode import make
qr = make(short_url)
qr.save(f'qr_{short_id}.png')
```

### Add User Accounts
- Add `users` table
- Authenticate requests
- Track links per user

### Add Geographic Analytics
- Store visitor location
- Store user agent information
- Create analytics dashboard

### Migrate to PostgreSQL
```python
# Replace SQLite with PostgreSQL
# pip install psycopg2-binary sqlalchemy
from sqlalchemy import create_engine
```

### Deploy Online
- **Heroku**: Free deployment
- **AWS**: EC2 or Lambda
- **DigitalOcean**: Affordable VPS
- **PythonAnywhere**: Python-specific hosting

## Troubleshooting 🐛

### Port 5000 already in use
```bash
# Change port in main.py line: app.run(debug=True, port=5001)
# Or kill the process using the port
```

### Database locked error
- Ensure only one instance of the app is running
- Delete `urls.db` and restart to reset

### CORS errors
- Make sure Flask-CORS is installed
- Check that the API URL in script.js matches your backend

## Code Walkthrough 📚

### main.py Highlights
```python
# Base62 encoding function
def base62_encode(num):
    digits = []
    while num:
        digits.append(BASE62_CHARS[num % 62])
        num //= 62
    return ''.join(reversed(digits))

# Shorten endpoint
@app.route('/api/shorten', methods=['POST'])
def shorten_url():
    # Validate, generate ID, store in DB
    # Return shortened URL
```

### script.js Highlights
```javascript
// API call
async function handleShortenURL(e) {
    const response = await fetch(`${API_BASE}/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, custom_alias })
    });
    // Display result
}
```

## Performance Notes 📊

- **Average Response Time**: < 50ms for short/redirect
- **Database Queries**: O(1) lookup by short_id (indexed)
- **Scalability**: Handles 1000+ URLs easily on SQLite
- **URL Limit**: No hard limit, expandable with pagination

## Security Considerations 🔒

Current implementation (development-safe):
- Input validation for URLs
- SQL injection protection (parameterized queries)
- Custom alias validation

For production:
- Add rate limiting
- Implement authentication
- Use HTTPS
- Add input sanitization
- Log malicious activity

## Testing the API 🧪

Using curl:
```bash
# Shorten a URL
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'

# Get stats
curl http://localhost:5000/api/stats/1

# List all
curl http://localhost:5000/api/all
```

## Future Enhancements 🚀

- [ ] Password protection for links
- [ ] Bulk shortening
- [ ] Browser extension
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Link preview
- [ ] Custom domains
- [ ] Export to CSV

## License 📝

This project is open source and free to use for educational purposes.

## Support 💬

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments
3. Check Flask documentation: https://flask.palletsprojects.com/

---

**Happy shortening! 🎉**
