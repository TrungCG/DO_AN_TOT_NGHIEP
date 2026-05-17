"""
Celery configuration for Task Management System.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'TaskManagementSystem.settings')

app = Celery('TaskManagementSystem')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Schedule: chạy mỗi giờ vào phút 0
app.conf.beat_schedule = {
    'check-overdue-tasks-hourly': {
        'task': 'API.tasks.check_overdue_tasks_periodic',
        'schedule': crontab(minute=0),  # Mỗi giờ
    },
    'send-today-task-reminders': {
        'task': 'API.tasks.send_today_task_reminders',
        'schedule': crontab(hour=5, minute=0),  # Mỗi sáng 5:00
    },
    'send-tomorrow-task-reminders': {
        'task': 'API.tasks.send_tomorrow_task_reminders',
        'schedule': crontab(hour=5, minute=0),  # Mỗi sáng 5:00
    },
}

app.conf.timezone = 'Asia/Ho_Chi_Minh'
