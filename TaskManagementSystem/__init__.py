# Load Celery app khi Django khởi động
from .celery import app as celery_app

__all__ = ('celery_app',)
