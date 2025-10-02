#!/bin/bash
# This script is used to create migrations for the 'users' app in a Django project.
python manage.py makemigrations users

# If table users already exists
python manage.py migrate users --fake-initial

# Re-apply migrations
python manage.py migrate

# Run the Django development server
python manage.py runserver

