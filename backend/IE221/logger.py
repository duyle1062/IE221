import json
import logging
import os
import sys
from datetime import datetime, timezone

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

class CloudWatchJSONFormatter(logging.Formatter):
    """
    JSON formatter optimized for AWS CloudWatch Logs.
    Outputs structured JSON that CloudWatch can parse and filter.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields (user_id, request_id, etc.)
        if hasattr(record, "__dict__"):
            extra_fields = {
                k: v for k, v in record.__dict__.items()
                if k not in {
                    "name", "msg", "args", "created", "filename", "funcName",
                    "levelname", "levelno", "lineno", "module", "msecs",
                    "pathname", "process", "processName", "relativeCreated",
                    "stack_info", "exc_info", "exc_text", "thread", "threadName",
                    "message", "asctime",
                }
            }
            if extra_fields:
                log_data["extra"] = extra_fields

        return json.dumps(log_data, default=str, ensure_ascii=False)


class SimpleFormatter(logging.Formatter):
    """Simple colored formatter for development."""

    COLORS = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "json": {
            "()": CloudWatchJSONFormatter,
        },
        "simple": {
            "()": SimpleFormatter,
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%H:%M:%S",
        },
    },

    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "simple" if DEBUG else "json",
        },
    },

    "loggers": {
        # Django core
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        # HTTP requests
        "django.request": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        # Database queries (WARNING to reduce noise)
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        # Security
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        # Your apps
        "apps": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        # Gunicorn
        "gunicorn.access": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "gunicorn.error": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },

    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
}

def get_logger(name: str | None = None) -> logging.Logger:
    """
    Get a logger instance.

    Usage:
        from IE221.logger import get_logger
        logger = get_logger(__name__)

        logger.info("User logged in", extra={"user_id": 123})
        logger.error("Payment failed", extra={"order_id": 456, "amount": 100})
    """
    return logging.getLogger(name or "apps")


# Default logger for quick imports
logger = get_logger("apps")
