from datetime import timedelta
import os
from pathlib import Path
from decouple import config
from .logger import LOGGING 

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config(
    "SECRET_KEY",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=str).split(
    ","
)

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "djoser",
    "apps.users",
    "apps.authentication",
    "apps.carts",
    "apps.product",
    "apps.orders",
    "apps.addresses",
    "apps.payment",
    "health_check",
    "health_check.db",
    # "health_check.cache",  # Enable if using Redis/Memcached
    # "health_check.storage",  # Enable if using django-storages
    # "health_check.contrib.migrations",  # Enable if you want to check for pending migrations
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware", 
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# CORS configuration
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000,https://d1a87c4jc0zeu.cloudfront.net",
    cast=lambda v: [s.strip() for s in v.split(",")]
)

# CSRF trusted origins (required for cross-origin POST requests in Django 4.0+)
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:3000",
    cast=lambda v: [s.strip() for s in v.split(",")]
)

ROOT_URLCONF = "IE221.urls"

# Site ID for django.contrib.sites
SITE_ID = 1

# Template directories - only include 'build' if it exists (for serving React from Django)
_template_dirs = [d for d in [os.path.join(BASE_DIR, "build")] if os.path.exists(d)]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": _template_dirs,
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "IE221.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME"),
        "USER": config("DB_USER"),
        "PASSWORD": config("DB_PASSWORD"),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        "CONN_MAX_AGE": 60,  # Connection pooling: keep connections open for 60 seconds
        "CONN_HEALTH_CHECKS": True,  # Verify connections before use (Django 4.1+)
        "OPTIONS": {
            "sslmode": "require" if config("DB_SSLMODE", default="disable") == "require" else "disable"
        },
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Only include directories that exist (avoids collectstatic errors)
STATICFILES_DIRS = [
    d for d in [
        BASE_DIR / "static",
        BASE_DIR / "build" / "static",
    ] if d.exists()
]


# Media files (user uploads)
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    "AUTH_HEADER_TYPES": ("JWT",),
    "TOKEN_OBTAIN_SERIALIZER": "apps.authentication.serializers.CustomTokenObtainPairSerializer",
    "PASSWORD_RESET_TIMEOUT": timedelta(minutes=10),  # in minutes
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),  # in minutes
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),  # in days
    "UPDATE_LAST_LOGIN": True,
}

# AWS configuration for media file storage
AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", default="ie221")
AWS_S3_REGION_NAME = "ap-southeast-1"
AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_CLOUDFRONT_DOMAIN = config("AWS_CLOUDFRONT_DOMAIN", default=None)

DJOSER = {
    "LOGIN_FIELD": "email",
    "USER_CREATE_PASSWORD_RETYPE": True,
    "USERNAME_CHANGED_EMAIL_CONFIRMATION": True,
    "PASSWORD_CHANGED_EMAIL_CONFIRMATION": True,
    "SEND_CONFIRMATION_EMAIL": True,
    "SET_USERNAME_RETYPE": True,
    "SET_PASSWORD_RETYPE": True,
    "LOGOUT_ON_PASSWORD_CHANGE": True,
    "PASSWORD_RESET_CONFIRM_URL": "reset-password?uid={uid}&token={token}",
    "USERNAME_RESET_CONFIRM_URL": "email/reset/confirm/{uid}/{token}",
    "ACTIVATION_URL": "verify-email?uid={uid}&token={token}",
    "SEND_ACTIVATION_EMAIL": True,
    "DOMAIN": "localhost:3000",
    "PROTOCOL": "http",
    "SITE_NAME": "IE221",
    "PERMISSIONS": {
        "user_create": ["rest_framework.permissions.AllowAny"],
        "password_reset": ["rest_framework.permissions.AllowAny"],
        "password_reset_confirm": ["rest_framework.permissions.AllowAny"],
        "activation": ["rest_framework.permissions.AllowAny"],
    },
    "EMAIL": {
        "activation": "apps.authentication.email.ActivationEmail",
        "password_reset": "apps.authentication.email.PasswordResetEmail",
        "confirmation": "apps.authentication.email.ConfirmationEmail",
    },
    "SOCIAL_AUTH_TOKEN_STRATEGY": "djoser.social.token.jwt.TokenStrategy",
    "SOCIAL_AUTH_ALLOWED_REDIRECT_URIS": [
        "http://localhost:8000/google",
        "http://localhost:8000/facebook",
    ],
    "SERIALIZERS": {
        "user_create": "apps.authentication.serializers.UserCreateSerializer",
        "user_create_password_retype": "apps.authentication.serializers.UserCreateSerializer",
        "user": "apps.authentication.serializers.UserSerializer",
        "current_user": "apps.authentication.serializers.UserSerializer",
        "user_delete": "djoser.serializers.UserDeleteSerializer",
    },
}

AUTH_USER_MODEL = "users.UserAccount"

# VNPAY Payment Gateway Configuration
# Documentation: https://sandbox.vnpayment.vn/apis/docs/
VNPAY_TMN_CODE = os.environ.get("VNPAY_TMN_CODE", "BG6RGL0E")
VNPAY_HASH_SECRET = os.environ.get(
    "VNPAY_HASH_SECRET", "N9G7A5AEQPUT1S17LTU3J8SSPXEAL03Z"
)
VNPAY_PAYMENT_URL = os.environ.get(
    "VNPAY_PAYMENT_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
)
VNPAY_RETURN_URL = os.environ.get(
    "VNPAY_RETURN_URL", "http://localhost:3000/payment/result"
)
VNPAY_API_URL = os.environ.get(
    "VNPAY_API_URL", "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
)

# PRODUCTION SECURITY SETTINGS

if not DEBUG:
    # HTTPS/SSL settings
    SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # HSTS (HTTP Strict Transport Security)
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Cookie security
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Additional security headers
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = "DENY"

    # Djoser production settings (override localhost defaults)
    DJOSER["DOMAIN"] = config("FRONTEND_DOMAIN", default="localhost:3000")
    DJOSER["PROTOCOL"] = config("FRONTEND_PROTOCOL", default="http")
