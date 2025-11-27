"""
Gunicorn configuration file for production deployment.
Documentation: https://docs.gunicorn.org/en/stable/settings.html
"""

import multiprocessing
import os

# Server Socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker Processes
workers = int(os.environ.get("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
graceful_timeout = 30
keepalive = 2

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process Naming
proc_name = "ie221_backend"

# Server Mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed in the future)
# keyfile = None
# certfile = None

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
