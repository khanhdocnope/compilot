from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import sqlite3
import string
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DATABASE = 'urls.db'
BASE62_CHARS = string.digits + string.ascii_lowercase + string.ascii_uppercase

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DATABASE):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS urls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_url TEXT NOT NULL,
                short_id TEXT UNIQUE NOT NULL,
                custom_alias TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                clicks INTEGER DEFAULT 0
            )
        ''')
        conn.commit()
        conn.close()

def base62_encode(num):
    """Convert a number to base62 string"""
    if num == 0:
        return BASE62_CHARS[0]
    
    digits = []
    while num:
        digits.append(BASE62_CHARS[num % 62])
        num //= 62
    
    return ''.join(reversed(digits))

def base62_decode(s):
    """Convert a base62 string to number"""
    result = 0
    for char in s:
        result = result * 62 + BASE62_CHARS.index(char)
    return result

def get_next_short_id():
    """Get the next available short ID"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT MAX(id) FROM urls')
    max_id = cursor.fetchone()[0]
    conn.close()
    
    next_id = (max_id or 0) + 1
    return base62_encode(next_id)

@app.route('/api/shorten', methods=['POST'])
def shorten_url():
    """Shorten a URL"""
    data = request.get_json()
    original_url = data.get('url')
    custom_alias = data.get('custom_alias', '').strip()
    expiration_hours = data.get('expiration_hours', 0)  # 0 means no expiration
    
    if not original_url:
        return jsonify({'error': 'URL is required'}), 400
    
    # Add http:// if not present
    if not original_url.startswith(('http://', 'https://')):
        original_url = 'https://' + original_url
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if custom alias is provided
        if custom_alias:
            # Validate custom alias (alphanumeric and hyphens only)
            if not all(c.isalnum() or c == '-' for c in custom_alias):
                return jsonify({'error': 'Custom alias can only contain letters, numbers, and hyphens'}), 400
            
            # Check if custom alias already exists
            cursor.execute('SELECT short_id FROM urls WHERE custom_alias = ? OR short_id = ?', 
                          (custom_alias, custom_alias))
            if cursor.fetchone():
                return jsonify({'error': 'This alias is already taken'}), 409
            
            short_id = custom_alias
        else:
            # Generate automatic short ID
            short_id = get_next_short_id()
        
        # Calculate expiration time
        expires_at = None
        if expiration_hours > 0:
            expires_at = (datetime.now() + timedelta(hours=expiration_hours)).isoformat()
        
        # Insert into database
        cursor.execute('''
            INSERT INTO urls (original_url, short_id, custom_alias, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (original_url, short_id, custom_alias if custom_alias else None, expires_at))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'short_id': short_id,
            'original_url': original_url,
            'short_url': f'http://localhost:5000/{short_id}'
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/<short_id>', methods=['GET'])
def get_stats(short_id):
    """Get statistics for a shortened URL"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT original_url, created_at, clicks, expires_at
        FROM urls 
        WHERE short_id = ? OR custom_alias = ?
    ''', (short_id, short_id))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return jsonify({'error': 'Short URL not found'}), 404
    
    return jsonify({
        'original_url': row['original_url'],
        'created_at': row['created_at'],
        'clicks': row['clicks'],
        'expires_at': row['expires_at']
    }), 200

@app.route('/<short_id>', methods=['GET'])
def redirect_url(short_id):
    """Redirect to original URL"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT original_url, expires_at FROM urls 
        WHERE short_id = ? OR custom_alias = ?
    ''', (short_id, short_id))
    
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return 'Short URL not found', 404
    
    # Check if link has expired
    if row['expires_at']:
        if datetime.fromisoformat(row['expires_at']) < datetime.now():
            conn.close()
            return 'This link has expired', 410
    
    # Increment click count
    cursor.execute('UPDATE urls SET clicks = clicks + 1 WHERE short_id = ? OR custom_alias = ?', 
                   (short_id, short_id))
    conn.commit()
    conn.close()
    
    return redirect(row['original_url'], code=301)

@app.route('/api/all', methods=['GET'])
def get_all_urls():
    """Get all shortened URLs"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT short_id, custom_alias, original_url, created_at, clicks, expires_at
        FROM urls
        ORDER BY created_at DESC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    urls = []
    for row in rows:
        urls.append({
            'id': row['custom_alias'] or row['short_id'],
            'short_id': row['short_id'],
            'custom_alias': row['custom_alias'],
            'original_url': row['original_url'],
            'created_at': row['created_at'],
            'clicks': row['clicks'],
            'expires_at': row['expires_at']
        })
    
    return jsonify(urls), 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
