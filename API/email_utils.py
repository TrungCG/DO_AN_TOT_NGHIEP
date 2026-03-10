"""
Email utility module for Task Management System.
Handles sending email notifications.
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_notification_email(recipient_email, subject, message, html_template=None, context=None):
    """
    Gửi email thông báo cho một người dùng.
    """
    try:
        if html_template and context:
            html_content = render_to_string(html_template, context)
            text_content = strip_tags(html_content)
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
        else:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
        
        logger.info(f"Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False


def send_overdue_task_notification(task, project_members):
    """
    Gửi email thông báo task quá hạn cho toàn bộ thành viên dự án.
    """
    subject = f"[Cảnh báo] Công việc quá hạn: {task.title}"
    
    context = {
        'task': task,
        'project': task.project,
        'due_date': task.due_date.strftime("%d/%m/%Y %H:%M") if task.due_date else "N/A",
        'assignee': task.assignee.username if task.assignee else "Chưa phân công",
        'priority': task.get_priority_display(),
        'status': task.get_status_display(),
    }
    
    message = f"""
Công việc "{task.title}" trong dự án "{task.project.name}" đã quá hạn.

- Hạn hoàn thành: {context['due_date']}
- Người được giao: {context['assignee']}
- Độ ưu tiên: {context['priority']}
- Trạng thái: {context['status']}

Vui lòng kiểm tra và cập nhật tiến độ.

Hệ thống Quản lý Công việc
"""
    
    recipients = [member.email for member in project_members if member.email]
    success_count = 0
    
    for recipient_email in recipients:
        try:
            email_context = {**context, 'recipient_email': recipient_email}
            if send_notification_email(recipient_email, subject, message, 
                                       'emails/overdue_task.html', email_context):
                success_count += 1
        except Exception:
            if send_notification_email(recipient_email, subject, message):
                success_count += 1
    
    logger.info(f"Sent overdue notification for task '{task.title}' to {success_count}/{len(recipients)} members")
    return success_count


def send_personal_task_overdue_notification(task, user):
    """
    Gửi email thông báo task cá nhân quá hạn cho người tạo.
    """
    if not user.email:
        return False
    
    subject = f"[Nhắc nhở] Việc cá nhân quá hạn: {task.title}"
    
    message = f"""
Xin chào {user.username},

Công việc cá nhân của bạn đã quá hạn:

- Tiêu đề: {task.title}
- Mô tả: {task.description or 'Không có'}
- Hạn hoàn thành: {task.due_date.strftime("%d/%m/%Y %H:%M") if task.due_date else 'N/A'}
- Độ ưu tiên: {task.get_priority_display()}
- Trạng thái: {task.get_status_display()}

Vui lòng cập nhật tiến độ hoặc điều chỉnh thời hạn.

Hệ thống Quản lý Công việc
"""
    
    context = {
        'task': task,
        'user': user,
        'due_date': task.due_date.strftime("%d/%m/%Y %H:%M") if task.due_date else "N/A",
        'priority': task.get_priority_display(),
        'status': task.get_status_display(),
    }
    
    try:
        return send_notification_email(user.email, subject, message,
                                       'emails/personal_task_overdue.html', context)
    except Exception:
        return send_notification_email(user.email, subject, message)


def send_task_assigned_notification(task, assignee, assigner):
    """
    Gửi email thông báo khi được giao task mới.
    """
    if not assignee.email:
        return False
    
    subject = f"[Giao việc] Bạn được giao công việc: {task.title}"
    
    project_name = task.project.name if task.project else "Việc cá nhân"
    due_date = task.due_date.strftime("%d/%m/%Y %H:%M") if task.due_date else "Không có"
    
    message = f"""
Xin chào {assignee.username},

{assigner.username} vừa giao cho bạn một công việc mới.

Chi tiết:
- Tiêu đề: {task.title}
- Dự án: {project_name}
- Mô tả: {task.description or 'Không có mô tả'}
- Hạn hoàn thành: {due_date}
- Độ ưu tiên: {task.get_priority_display()}

Vui lòng đăng nhập hệ thống để xem chi tiết và bắt đầu công việc.

Hệ thống Quản lý Công việc
"""
    
    context = {
        'task': task,
        'assignee': assignee,
        'assigner': assigner,
        'project_name': project_name,
        'due_date': due_date,
        'priority': task.get_priority_display(),
    }
    
    try:
        return send_notification_email(assignee.email, subject, message,
                                       'emails/task_assigned.html', context)
    except Exception:
        return send_notification_email(assignee.email, subject, message)


def send_project_invitation_notification(project, inviter, invitee):
    """
    Gửi email thông báo khi được thêm vào dự án.
    """
    if not invitee.email:
        return False
    
    subject = f"[Thêm vào dự án] Bạn đã được thêm vào dự án: {project.name}"
    
    message = f"""
Xin chào {invitee.username},

{inviter.username} đã thêm bạn vào dự án "{project.name}".

Mô tả dự án: {project.description or 'Không có mô tả'}

Vui lòng đăng nhập hệ thống để xem chi tiết dự án và bắt đầu làm việc.

Hệ thống Quản lý Công việc
"""
    
    context = {
        'project': project,
        'inviter': inviter,
        'invitee': invitee,
    }
    
    try:
        return send_notification_email(invitee.email, subject, message,
                                       'emails/project_invitation.html', context)
    except Exception:
        return send_notification_email(invitee.email, subject, message)


def send_task_due_date_changed_notification(task, changed_by, old_due_date, recipients):
    """
    Gửi email thông báo khi thời hạn task bị thay đổi.
    """
    subject = f"[Thay đổi thời hạn] {task.title}"
    
    project_name = task.project.name if task.project else "Việc cá nhân"
    old_date_str = old_due_date.strftime("%d/%m/%Y %H:%M") if old_due_date else "Không có"
    new_date_str = task.due_date.strftime("%d/%m/%Y %H:%M") if task.due_date else "Không có"
    
    message = f"""
{changed_by.username} đã thay đổi thời hạn công việc "{task.title}".

- Dự án: {project_name}
- Thời hạn cũ: {old_date_str}
- Thời hạn mới: {new_date_str}

Hệ thống Quản lý Công việc
"""
    
    context = {
        'task': task,
        'changed_by': changed_by,
        'project_name': project_name,
        'old_due_date': old_date_str,
        'new_due_date': new_date_str,
    }
    
    success_count = 0
    for user in recipients:
        if user.email and user != changed_by:
            try:
                if send_notification_email(user.email, subject, message,
                                           'emails/task_due_date_changed.html', context):
                    success_count += 1
            except Exception:
                if send_notification_email(user.email, subject, message):
                    success_count += 1
    return success_count


def send_task_comment_notification(task, comment, commenter, recipients):
    """
    Gửi email thông báo khi có bình luận mới.
    """
    subject = f"[Bình luận mới] {task.title}"
    
    project_name = task.project.name if task.project else "Việc cá nhân"
    comment_preview = comment.body[:100] + ("..." if len(comment.body) > 100 else "")
    
    message = f"""
{commenter.username} đã bình luận trong công việc "{task.title}":

"{comment_preview}"

Dự án: {project_name}

Hệ thống Quản lý Công việc
"""
    
    context = {
        'task': task,
        'comment': comment,
        'commenter': commenter,
        'project_name': project_name,
        'comment_preview': comment_preview,
    }
    
    success_count = 0
    for user in recipients:
        if user.email and user != commenter:
            try:
                if send_notification_email(user.email, subject, message,
                                           'emails/task_comment.html', context):
                    success_count += 1
            except Exception:
                if send_notification_email(user.email, subject, message):
                    success_count += 1
    return success_count


def send_task_deleted_notification(task_title, project, deleted_by, recipients):
    """
    Gửi email thông báo khi task bị xóa.
    """
    subject = f"[Đã xóa] Công việc: {task_title}"
    
    project_name = project.name if project else "Việc cá nhân"
    
    message = f"""
{deleted_by.username} đã xóa công việc "{task_title}" trong dự án "{project_name}".

Hệ thống Quản lý Công việc
"""
    
    context = {
        'task_title': task_title,
        'project_name': project_name,
        'deleted_by': deleted_by,
    }
    
    success_count = 0
    for user in recipients:
        if user.email and user != deleted_by:
            try:
                if send_notification_email(user.email, subject, message,
                                           'emails/task_deleted.html', context):
                    success_count += 1
            except Exception:
                if send_notification_email(user.email, subject, message):
                    success_count += 1
    return success_count


def send_task_status_changed_notification(task, changed_by, old_status, recipients):
    """
    Gửi email thông báo khi trạng thái task thay đổi.
    """
    subject = f"[Cập nhật trạng thái] {task.title}"
    
    project_name = task.project.name if task.project else "Việc cá nhân"
    
    # Map status codes to display names
    status_map = {
        'TODO': 'To Do',
        'INPR': 'In Progress', 
        'DONE': 'Done'
    }
    old_status_display = status_map.get(old_status, old_status)
    new_status_display = task.get_status_display()
    
    message = f"""
{changed_by.username} đã thay đổi trạng thái công việc "{task.title}".

- Dự án: {project_name}
- Trạng thái cũ: {old_status_display}
- Trạng thái mới: {new_status_display}

Hệ thống Quản lý Công việc
"""
    
    context = {
        'task': task,
        'changed_by': changed_by,
        'project_name': project_name,
        'old_status': old_status_display,
        'new_status': new_status_display,
    }
    
    success_count = 0
    for user in recipients:
        if user.email and user != changed_by:
            try:
                if send_notification_email(user.email, subject, message,
                                           'emails/task_status_changed.html', context):
                    success_count += 1
            except Exception:
                if send_notification_email(user.email, subject, message):
                    success_count += 1
    return success_count


def send_member_removed_notification(project, remover, removed_user):
    """
    Gửi email thông báo khi bị xóa khỏi dự án.
    """
    if not removed_user.email:
        return False
    
    subject = f"[Thông báo] Bạn đã bị xóa khỏi dự án: {project.name}"
    
    message = f"""
Xin chào {removed_user.username},

{remover.username} đã xóa bạn khỏi dự án "{project.name}".

Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ với quản lý dự án.

Hệ thống Quản lý Công việc
"""
    
    context = {
        'project': project,
        'remover': remover,
        'removed_user': removed_user,
    }
    
    try:
        return send_notification_email(removed_user.email, subject, message,
                                       'emails/member_removed.html', context)
    except Exception:
        return send_notification_email(removed_user.email, subject, message)
