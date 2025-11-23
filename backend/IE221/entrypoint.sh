#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."

# Wait for PostgreSQL to be ready (uses DB_HOST and DB_PORT from settings.py)
counter=0
while ! nc -z ${DB_HOST:-localhost} ${DB_PORT:-5432}; do
    sleep 0.5
    counter=$((counter + 1))
    if [ $counter -ge 120 ]; then  # 120 * 0.5s = 60s timeout
        echo "Timeout: Unable to connect to PostgreSQL at ${DB_HOST}:${DB_PORT} after 60 seconds."
        exit 1
    fi
done

echo "PostgreSQL started successfully"

# Run database migrations (migrations should be created in dev, not production)
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files (for Django Admin, etc.)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn with Django WSGI application
echo "Starting Gunicorn..."
exec gunicorn --config gunicorn.conf.py IE221.wsgi:application
