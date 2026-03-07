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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, custom_alias }),
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



🔗 Dự án Rút gọn URL
Một ứng dụng rút gọn URL đầy đủ tính năng (full-stack) với giao diện web hiện đại và backend sử dụng Flask.

Tính năng ✨
Tính năng cốt lõi
Rút gọn URL: Chuyển đổi các URL dài thành các liên kết ngắn gọn, dễ chia sẻ.

Mã hóa Base62: Tạo mã ngắn chuyên nghiệp.

Theo dõi lượt nhấp: Giám sát số lần mỗi liên kết được truy cập.

Bí danh tùy chỉnh: Tự chọn mã ngắn theo ý muốn của bạn.

Tính năng nâng cao
Hạn dùng liên kết: Thiết lập thời gian tồn tại cho URL (từ 1 giờ đến 30 ngày).

Bảng điều khiển phân tích: Xem tất cả các liên kết đã tạo và số liệu thống kê của chúng.

Thống kê thời gian thực: Theo dõi ngày tạo và số lượt nhấp.

Thiết kế thích ứng (Responsive): Giao diện đẹp mắt, hoạt động tốt trên mọi thiết bị.

Cấu trúc dự án 📁
gitcompilot/
├── main.py              # Máy chủ Flask backend
├── index.html           # Giao diện người dùng (Frontend)
├── script.js            # Logic JavaScript
├── style.css            # Định dạng giao diện (CSS)
├── requirements.txt     # Các thư viện Python cần thiết
├── urls.db              # Cơ sở dữ liệu SQLite (tự động tạo khi chạy lần đầu)
└── README.md            # Tệp hướng dẫn này
Cách thức hoạt động 🔧
1. Quy trình rút gọn URL
Dữ liệu nhập: "https://example.com/duong/dan/rat/dai?param=value"
         ↓
    Xử lý tại Backend (Mã hóa Base62)
         ↓
    Lưu trữ Database: {"aB7k2": "https://..."}
         ↓
Dữ liệu xuất: "http://localhost:5000/aB7k2"
2. Cấu trúc Cơ sở dữ liệu
Bảng urls:
├── id (INTEGER, Khóa chính)
├── original_url (TEXT)
├── short_id (TEXT, Duy nhất)
├── custom_alias (TEXT, Duy nhất, Tùy chọn)
├── created_at (TIMESTAMP)
├── expires_at (TIMESTAMP, Tùy chọn)
└── clicks (INTEGER)
Bắt đầu sử dụng 🚀
Yêu cầu hệ thống
Python 3.7 trở lên

pip (Trình quản lý gói của Python)

Cài đặt
Tải dự án về máy

Bash
cd gitcompilot
Cài đặt các thư viện phụ thuộc

Bash
pip install -r requirements.txt
Chạy máy chủ Flask

Bash
python main.py
Mở trên trình duyệt
Truy cập địa chỉ: http://localhost:5000

Hướng dẫn sử dụng 📖
Rút gọn cơ bản
Dán URL dài vào ô nhập liệu.

Nhấn "Rút gọn URL".

Sao chép liên kết ngắn được tạo ra.

Tùy chọn nâng cao
Nhấn vào "⚙️ Tùy chọn nâng cao".

Bí danh tùy chỉnh: Nhập mã ngắn riêng của bạn (ví dụ: "du-an-cua-toi").

Hạn dùng liên kết: Chọn thời điểm liên kết sẽ hết hiệu lực.

Xem thống kê
Liên kết gần đây: Xem danh sách các liên kết đã tạo trên bảng điều khiển.

Lượt nhấp: Theo dõi số lần liên kết được sử dụng.

Các điểm cuối API (Endpoints) 🔌
POST /api/shorten
Tạo một URL rút gọn.

Yêu cầu (Request):

JSON
{
  "url": "https://example.com/path",
  "custom_alias": "link-cua-toi",
  "expiration_hours": 24
}
GET /api/all
Lấy danh sách tất cả các URL đã rút gọn.

Công nghệ sử dụng 💻
Backend: Flask (Python), SQLite3.

Frontend: HTML5, CSS3, Vanilla JavaScript.

Bảo mật 🔒
Phiên bản hiện tại (An toàn cho môi trường phát triển):

Kiểm tra tính hợp lệ của URL đầu vào.

Chống tấn công SQL injection (truy vấn có tham số).

Kiểm tra tính hợp lệ của bí danh tùy chỉnh.

Chúc bạn rút gọn liên kết vui vẻ! 🎉