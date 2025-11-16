#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'IE221.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Check database connection
    cursor.execute("SELECT current_database(), current_user;")
    db_info = cursor.fetchone()
    print(f"Database: {db_info[0]}")
    print(f"User: {db_info[1]}")
    print()
    
    # Check product_images table schema
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'product_images'
        ORDER BY ordinal_position;
    """)
    
    print("Columns in product_images table:")
    for row in cursor.fetchall():
        print(f"  - {row[0]}: {row[1]}")
