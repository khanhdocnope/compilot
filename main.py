from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import string
import os
import validators
from datetime import datetime, timedelta
import threading
import qrcode
import io
import base64

app = Flask(__name__)

# Configure CORS: Allow specific origins or use environment variable
# For Render deployment, set FRONTEND_URL environment variable
frontend_url = os.environ.get("FRONTEND_URL", "https://rut-gon-link-r3jo.onrender.com")
CORS(app, resources={r"/*": {"origins": frontend_url}})

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://data_ze7e_user:ysxA2hJOXfmXauH4nDwxyo4qt8V7yfBk@dpg-d6lql8fgi27c73dorqmg-a/data_ze7e",
)
BASE62_CHARS = string.digits + string.ascii_lowercase + string.ascii_uppercase
id_lock = threading.Lock()


def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.cursor_factory = RealDictCursor
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS urls (
            id SERIAL PRIMARY KEY,
            original_url TEXT NOT NULL,
            short_id TEXT UNIQUE NOT NULL,
            custom_alias TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            clicks INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()


# Initialize database on startup, but don't fail if connection not ready
def safe_init_db():
    try:
        init_db()
    except Exception as e:
        print(f"Database initialization deferred: {e}")


# Try to initialize on startup
safe_init_db()


def encode_base62(num):
    if num == 0:
        return BASE62_CHARS[0]
    arr = []
    while num:
        num, rem = divmod(num, 62)
        arr.append(BASE62_CHARS[rem])
    arr.reverse()
    return "".join(arr)


def generate_qr_code(url):
    """Generate QR code as base64 string"""
    qr = qrcode.make(url)
    buffered = io.BytesIO()
    qr.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{qr_base64}"


@app.route("/api/shorten", methods=["POST"])
def shorten_url():
    # Ensure database is initialized
    safe_init_db()
    data = request.json
    original_url = data.get("url")
    custom_alias = data.get("custom_alias")
    expire_hours = data.get("expire_hours")

    if not original_url or not validators.url(original_url):
        return jsonify({"error": "URL không hợp lệ"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        if custom_alias:
            cursor.execute("SELECT id FROM urls WHERE custom_alias = %s", (custom_alias,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": "Alias đã tồn tại"}), 400
            short_id = custom_alias
        else:
            with id_lock:
                cursor.execute(
                    "INSERT INTO urls (original_url) VALUES (%s) RETURNING id",
                    (original_url,),
                )
                last_id = cursor.fetchone()["id"]
                short_id = encode_base62(last_id + 100000)
                cursor.execute(
                    "UPDATE urls SET short_id = %s WHERE id = %s", (short_id, last_id)
                )

        expires_at = None
        if expire_hours:
            expires_at = (datetime.now() + timedelta(hours=int(expire_hours))).isoformat()
            cursor.execute(
                "UPDATE urls SET expires_at = %s WHERE short_id = %s",
                (expires_at, short_id),
            )

        conn.commit()

        # Tạo QR code dưới dạng Base64 (Để tránh mất file trên Render)
        full_short_url = f"{request.host_url}{short_id}"
        qr_code = generate_qr_code(full_short_url)

        cursor.close()
        conn.close()
        return jsonify(
            {
                "short_id": short_id,
                "short_url": full_short_url,
                "original_url": original_url,
                "qr_code": qr_code,
                "expires_at": expires_at,
            }
        )
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/<short_id>")
def redirect_to_url(short_id):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT original_url, expires_at FROM urls WHERE short_id = %s OR custom_alias = %s",
            (short_id, short_id),
        )
        row = cursor.fetchone()

        if not row:
            return "URL không tồn tại", 404

        if row["expires_at"] and datetime.fromisoformat(row["expires_at"]) < datetime.now():
            return "Liên kết đã hết hạn", 410

        cursor.execute(
            "UPDATE urls SET clicks = clicks + 1 WHERE short_id = %s", (short_id,)
        )
        conn.commit()
        original_url = row["original_url"]
        return redirect(original_url)
    except Exception as e:
        if conn:
            conn.rollback()
        return f"Error: {str(e)}", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/all", methods=["GET"])
def get_all_urls():
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM urls ORDER BY created_at DESC")
        rows = cursor.fetchall()

        result = []
        for r in rows:
            short_url = f"{request.host_url}{r['short_id']}"
            qr_code = generate_qr_code(short_url)
            result.append(
                {
                    "id": r["short_id"],
                    "original_url": r["original_url"],
                    "short_url": short_url,
                    "clicks": r["clicks"],
                    "created_at": r["created_at"],
                    "expires_at": r["expires_at"],
                    "qr_code": qr_code,
                }
            )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
