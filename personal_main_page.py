import os
import json
import subprocess
import sys

def install_dependencies():
    """Check and install dependencies from requirements.txt."""
    # Get the directory where the script is located
    base_dir = os.path.dirname(os.path.abspath(__file__))
    req_file = os.path.join(base_dir, "Secure", "requirements.txt")
    
    if os.path.exists(req_file):
        print(f"Checking dependencies in {req_file}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])
            print("Dependencies verified and updated.")
        except Exception as e:
            print(f"Warning: Could not automatically install dependencies: {e}")
    else:
        print(f"Warning: requirements.txt not found at {req_file}. Skipping auto-install.")

# Run installation check BEFORE any other imports
install_dependencies()

from dotenv import load_dotenv

# Load environment variables from Secure/.env file
base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, "Secure", ".env")
load_dotenv(dotenv_path=env_path)
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import requests
import webbrowser
import time
import threading
from threading import Timer
from flask import Flask, render_template, jsonify
from datetime import datetime, timedelta

app = Flask(__name__)

# Heartbeat tracking for auto-shutdown
last_heartbeat = time.time()
SHUTDOWN_THRESHOLD = 10  # Seconds

def monitor_heartbeat():
    """Background thread to shut down the server if the browser is closed."""
    global last_heartbeat
    while True:
        time.sleep(2)
        if time.time() - last_heartbeat > SHUTDOWN_THRESHOLD:
            print("No heartbeat detected. Shutting down server...")
            os._exit(0)

# Start heartbeat monitor thread
threading.Thread(target=monitor_heartbeat, daemon=True).start()

# Configuration
base_dir = os.path.dirname(os.path.abspath(__file__))
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "harshit-001-it")
CACHE_FILE = os.path.join(base_dir, "Secure", "projects_cache.json")
CACHE_EXPIRY_HOURS = 24

# SMTP Configuration (For Email Notifications)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
# Credentials are now loaded safely from environment variables (.env file)
SMTP_EMAIL = os.getenv("SMTP_EMAIL") 
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL")

def fetch_github_projects():
    """Fetch public repositories from GitHub."""
    url = f"https://api.github.com/users/{GITHUB_USERNAME}/repos"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            repos = response.json()
            projects = []
            for repo in repos:
                if not repo['fork']:
                    projects.append({
                        'name': repo['name'],
                        'description': repo['description'] or "No description provided.",
                        'url': repo['html_url'],
                        'stars': repo['stargazers_count'],
                        'language': repo['language'],
                        'created_at': repo['created_at'],
                        'updated_at': repo['updated_at']
                    })
            return projects
    except Exception as e:
        print(f"Error fetching GitHub projects: {e}")
    return []

def get_categorized_projects():
    """Get projects from cache or fetch and categorize them."""
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r') as f:
            cache = json.load(f)
            cached_time = datetime.fromisoformat(cache['timestamp'])
            if datetime.now() - cached_time < timedelta(hours=CACHE_EXPIRY_HOURS):
                return cache['projects']

    projects = fetch_github_projects()
    # Improved categorization logic
    for p in projects:
        desc = (p['description'] or "").lower()
        name = p['name'].lower()
        combined = f"{name} {desc}"
        
        if any(kw in combined for kw in ['ml', 'machine learning', 'nlp', 'vision', 'training', 'data science', 'emotion-recognition']):
            p['category'] = 'Machine Learning'
        elif any(kw in combined for kw in ['web', 'html', 'css', 'react', 'flask', 'django', 'frontend', 'backend', 'js']):
            p['category'] = 'Web Development'
        elif any(kw in combined for kw in ['python', 'script', 'automation', 'bot']):
            p['category'] = 'Python Development'
        elif any(kw in combined for kw in ['java', 'android', 'spring']):
            p['category'] = 'Java Development'
        else:
            p['category'] = 'Software Engineering'

    with open(CACHE_FILE, 'w') as f:
        json.dump({'timestamp': datetime.now().isoformat(), 'projects': projects}, f)
    
    return projects

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/projects')
def get_projects():
    projects = get_categorized_projects()
    return jsonify(projects)

@app.route('/api/heartbeat', methods=['POST'])
def heartbeat():
    global last_heartbeat
    last_heartbeat = time.time()
    return jsonify({"status": "ok"})

@app.route('/api/contact', methods=['POST'])
def handle_contact():
    """Handle contact form submissions."""
    from flask import request
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')
    
    if not all([name, email, message]):
        return jsonify({"status": "error", "message": "All fields are required"}), 400
        
    base_dir = os.path.dirname(os.path.abspath(__file__))
    log_file = os.path.join(base_dir, "Secure", "messages.json")
    messages = []
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            try:
                messages = json.load(f)
            except:
                pass
                
    messages.append({
        "timestamp": datetime.now().isoformat(),
        "name": name,
        "email": email,
        "message": message
    })
    
    with open(log_file, 'w') as f:
        json.dump(messages, f, indent=4)
        
    # Send Email Notification
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f"New Portfolio Message from {name}"
        msg.add_header('reply-to', email)
        
        body = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email notification sent to {RECIPIENT_EMAIL}")
    except Exception as e:
        print(f"Failed to send email notification: {e}")
        # We don't return an error to the user since the message IS saved to JSON
        
    return jsonify({"status": "success", "message": "Message received!"})

def open_browser():
    """Automatically open the browser to the local server."""
    webbrowser.open_new("http://127.0.0.1:5005")

if __name__ == '__main__':
    # Ensure templates and static directories exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    # Open browser after a short delay to ensure server is ready
    Timer(1.5, open_browser).start()
    
    app.run(debug=True, port=5005, use_reloader=False)
