"""
Celery tasks cho việc gửi email tự động.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_overdue_tasks_periodic():
    """
    Task chạy định kỳ để kiểm tra và gửi email cho các task quá hạn.
    Chạy mỗi giờ, chỉ gửi nếu chưa thông báo trong 24h.
    """
    from API.models import Task, Notification
    from API.email_utils import send_overdue_task_notification, send_personal_task_overdue_notification
    
    now = timezone.now()
    threshold_time = now - timedelta(hours=24)
    
    overdue_tasks = Task.objects.filter(
        due_date__lt=now,
        status__in=['TODO', 'INPR']
    ).select_related('project', 'assignee', 'created_by')
    
    project_emails = 0
    personal_emails = 0
    
    for task in overdue_tasks:
        # Kiểm tra đã thông báo trong 24h chưa (dùng title để track)
        recent = Notification.objects.filter(
            title__contains='[QUÁ HẠN]',
            task=task,
            created_at__gte=threshold_time
        ).exists()
        
        if recent:
            continue
        
        try:
            if task.is_personal and task.created_by:
                if send_personal_task_overdue_notification(task, task.created_by):
                    personal_emails += 1
                    _create_notification(task, task.created_by)
            elif task.project:
                members = task.project.members.all()
                count = send_overdue_task_notification(task, members)
                if count > 0:
                    project_emails += count
                    for member in members:
                        _create_notification(task, member)
        except Exception as e:
            logger.error(f"Error processing task {task.id}: {str(e)}")
    
    logger.info(f"Overdue check complete: {project_emails} project, {personal_emails} personal emails sent")
    return {'project_emails': project_emails, 'personal_emails': personal_emails}


def _create_notification(task, user):
    """Tạo notification trong database"""
    from API.models import Notification
    try:
        Notification.objects.create(
            recipient=user,
            title=f'[QUÁ HẠN] {task.title}',
            message=f'Công việc "{task.title}" đã quá hạn',
            task=task,
            project=task.project
        )
    except Exception:
        pass
