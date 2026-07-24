import os

# Render sets the PORT env var automatically. This config file tells gunicorn to use it.
bind    = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
workers = 2          # 2 workers is ideal for Render's free/starter instances
threads = 2          # 2 threads per worker for I/O-bound work
timeout = 120        # seconds — generous for PDF uploads
loglevel = "info"
accesslog = "-"      # stdout
errorlog  = "-"      # stdout
