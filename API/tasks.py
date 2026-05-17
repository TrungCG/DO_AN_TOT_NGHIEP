"""
Celery tasks cho việc gửi email tự động.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
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


def _create_summary_notification(user, prefix, title, message):
    """Tạo 1 notification tổng hợp cho user (không gắn task cụ thể)"""
    from API.models import Notification
    try:
        Notification.objects.create(
            recipient=user,
            title=f'{prefix} {title}',
            message=message,
        )
    except Exception:
        pass


@shared_task
def send_today_task_reminders():
    """
    Gửi email nhắc nhở công việc đến hạn hôm nay cho các thành viên dự án.
    Chạy mỗi sáng sớm lúc 6:00.
    Bao gồm cả task dự án được giao và task cá nhân.
    """
    from API.models import Task, Notification
    from API.email_utils import send_task_due_today_reminder
    from django.contrib.auth import get_user_model
    from django.db.models import Q

    User = get_user_model()
    now = timezone.localtime(timezone.now())
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    today_date_str = now.strftime("%d/%m/%Y")

    # Lấy tất cả task đến hạn hôm nay và chưa hoàn thành
    tasks_due_today = Task.objects.filter(
        due_date__gte=today_start,
        due_date__lte=today_end,
        status__in=['TODO', 'INPR']
    ).select_related('project', 'assignee', 'created_by')

    # Gom task theo user
    user_project_tasks = defaultdict(list)
    user_personal_tasks = defaultdict(list)

    for task in tasks_due_today:
        if task.is_personal and task.created_by:
            user_personal_tasks[task.created_by.id].append(task)
        elif task.project:
            # Task dự án: gửi cho assignee (nếu có) hoặc tất cả thành viên
            if task.assignee:
                user_project_tasks[task.assignee.id].append(task)
            else:
                for member in task.project.members.all():
                    user_project_tasks[member.id].append(task)

    # Gộp danh sách user_id cần gửi
    all_user_ids = set(user_project_tasks.keys()) | set(user_personal_tasks.keys())
    users = {u.id: u for u in User.objects.filter(id__in=all_user_ids)}

    emails_sent = 0
    for user_id in all_user_ids:
        user = users.get(user_id)
        if not user or not user.email:
            continue

        # Kiểm tra đã gửi nhắc nhở hôm nay chưa
        already_sent = Notification.objects.filter(
            recipient=user,
            title__startswith='[NHẮC HÔM NAY]',
            created_at__gte=today_start
        ).exists()
        if already_sent:
            continue

        p_tasks = user_project_tasks.get(user_id, [])
        pr_tasks = user_personal_tasks.get(user_id, [])

        total = len(p_tasks) + len(pr_tasks)
        if send_task_due_today_reminder(user, p_tasks, pr_tasks, today_date_str):
            emails_sent += 1
            # Tạo 1 notification tổng hợp cho user
            task_names = ', '.join(t.title for t in (p_tasks + pr_tasks)[:3])
            suffix = f' và {total - 3} công việc khác' if total > 3 else ''
            _create_summary_notification(
                user, '[NHẮC HÔM NAY]',
                f'Bạn có {total} công việc cần hoàn thành hôm nay',
                f'{task_names}{suffix}'
            )

    logger.info(f"Today reminder: sent {emails_sent} emails")
    return {'emails_sent': emails_sent}


@shared_task
def send_tomorrow_task_reminders():
    """
    Gửi email nhắc nhở công việc đến hạn ngày mai.
    Chạy mỗi sáng sớm lúc 6:00.
    Bao gồm cả task dự án được giao và task cá nhân.
    """
    from API.models import Task, Notification
    from API.email_utils import send_task_due_tomorrow_reminder
    from django.contrib.auth import get_user_model
    from django.db.models import Q

    User = get_user_model()
    now = timezone.localtime(timezone.now())
    tomorrow = now + timedelta(days=1)
    tomorrow_start = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_end = tomorrow.replace(hour=23, minute=59, second=59, microsecond=999999)
    tomorrow_date_str = tomorrow.strftime("%d/%m/%Y")
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Lấy tất cả task đến hạn ngày mai và chưa hoàn thành
    tasks_due_tomorrow = Task.objects.filter(
        due_date__gte=tomorrow_start,
        due_date__lte=tomorrow_end,
        status__in=['TODO', 'INPR']
    ).select_related('project', 'assignee', 'created_by')

    # Gom task theo user
    user_project_tasks = defaultdict(list)
    user_personal_tasks = defaultdict(list)

    for task in tasks_due_tomorrow:
        if task.is_personal and task.created_by:
            user_personal_tasks[task.created_by.id].append(task)
        elif task.project:
            if task.assignee:
                user_project_tasks[task.assignee.id].append(task)
            else:
                for member in task.project.members.all():
                    user_project_tasks[member.id].append(task)

    all_user_ids = set(user_project_tasks.keys()) | set(user_personal_tasks.keys())
    users = {u.id: u for u in User.objects.filter(id__in=all_user_ids)}

    emails_sent = 0
    for user_id in all_user_ids:
        user = users.get(user_id)
        if not user or not user.email:
            continue

        # Kiểm tra đã gửi nhắc nhở ngày mai hôm nay chưa
        already_sent = Notification.objects.filter(
            recipient=user,
            title__startswith='[NHẮC NGÀY MAI]',
            created_at__gte=today_start
        ).exists()
        if already_sent:
            continue

        p_tasks = user_project_tasks.get(user_id, [])
        pr_tasks = user_personal_tasks.get(user_id, [])

        total = len(p_tasks) + len(pr_tasks)
        if send_task_due_tomorrow_reminder(user, p_tasks, pr_tasks, tomorrow_date_str):
            emails_sent += 1
            task_names = ', '.join(t.title for t in (p_tasks + pr_tasks)[:3])
            suffix = f' và {total - 3} công việc khác' if total > 3 else ''
            _create_summary_notification(
                user, '[NHẮC NGÀY MAI]',
                f'Bạn có {total} công việc cần hoàn thành ngày mai ({tomorrow_date_str})',
                f'{task_names}{suffix}'
            )

    logger.info(f"Tomorrow reminder: sent {emails_sent} emails")
    return {'emails_sent': emails_sent}
