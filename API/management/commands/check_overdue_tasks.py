"""
Management command để kiểm tra và gửi thông báo email cho các task quá hạn.
Chạy: python manage.py check_overdue_tasks
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from API.models import Task, Notification
from API.email_utils import send_overdue_task_notification, send_personal_task_overdue_notification


class Command(BaseCommand):
    help = 'Kiểm tra các task quá hạn và gửi email thông báo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Chỉ hiển thị task quá hạn, không gửi email',
        )
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Chỉ gửi email nếu chưa thông báo trong N giờ qua (mặc định: 24)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        hours_threshold = options['hours']
        now = timezone.now()
        threshold_time = now - timedelta(hours=hours_threshold)
        
        # Lấy các task quá hạn (chưa hoàn thành)
        overdue_tasks = Task.objects.filter(
            due_date__lt=now,
            status__in=['TODO', 'INPR']
        ).select_related('project', 'assignee', 'created_by')
        
        self.stdout.write(f"Tìm thấy {overdue_tasks.count()} task quá hạn")
        
        project_emails_sent = 0
        personal_emails_sent = 0
        
        for task in overdue_tasks:
            # Kiểm tra đã gửi thông báo gần đây chưa (dùng title để track)
            recent_notification = Notification.objects.filter(
                title__contains='[QUÁ HẠN]',
                task=task,
                created_at__gte=threshold_time
            ).exists()
            
            if recent_notification and hours_threshold > 0:
                self.stdout.write(f"  - Bỏ qua '{task.title}' (đã thông báo trong {hours_threshold}h qua)")
                continue
            
            if dry_run:
                self.stdout.write(f"  [DRY-RUN] Task: {task.title}")
                continue
            
            if task.is_personal:
                # Task cá nhân - gửi cho người tạo
                if task.created_by:
                    success = send_personal_task_overdue_notification(task, task.created_by)
                    if success:
                        personal_emails_sent += 1
                        self._create_notification(task, task.created_by)
                        self.stdout.write(self.style.SUCCESS(
                            f"  Đã gửi email cá nhân: {task.title} -> {task.created_by.email}"
                        ))
            else:
                # Task dự án - gửi cho tất cả thành viên
                if task.project:
                    members = task.project.members.all()
                    count = send_overdue_task_notification(task, members)
                    if count > 0:
                        project_emails_sent += count
                        for member in members:
                            self._create_notification(task, member)
                        self.stdout.write(self.style.SUCCESS(
                            f"  Đã gửi {count} email dự án: {task.title}"
                        ))
        
        self.stdout.write(self.style.SUCCESS(
            f"\nTổng kết: {project_emails_sent} email dự án, {personal_emails_sent} email cá nhân"
        ))

    def _create_notification(self, task, user):
        """Tạo notification trong database để theo dõi"""
        try:
            Notification.objects.create(
                recipient=user,
                title=f'[QUÁ HẠN] {task.title}',
                message=f'Công việc "{task.title}" đã quá hạn',
                task=task,
                project=task.project
            )
        except Exception:
            pass  # Bỏ qua nếu không tạo được notification
