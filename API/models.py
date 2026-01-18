from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings # Best practice: Dùng settings.AUTH_USER_MODEL

# MODEL USER (người dùng)
class User(AbstractUser):
    # avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Ảnh đại diện")
    # bio = models.TextField(null=True, blank=True, verbose_name="Giới thiệu")
    
    def __str__(self):
        return self.username

# MODEL PROJECT (dự án)
class Project(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên dự án")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả dự án")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='projects', verbose_name="Thành viên dự án")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='owned_projects', on_delete=models.CASCADE, verbose_name="Quản lý dự án")
    
    def __str__(self):
        return self.name

# MODEL TASK (công việc)
class Task(models.Model):
    class Status(models.TextChoices):
        TODO = 'TODO', 'To Do'
        IN_PROGRESS = 'INPR', 'In Progress'
        DONE = 'DONE', 'Done'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MED', 'Medium'
        HIGH = 'HIGH', 'High'

    title = models.CharField(max_length=255, verbose_name="Tiêu đề công việc")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả chi tiết")
    status = models.CharField(max_length=4, choices=Status.choices, default=Status.TODO, verbose_name="Trạng thái")
    priority = models.CharField(max_length=4, choices=Priority.choices, default=Priority.MEDIUM, verbose_name="Độ ưu tiên")
    due_date = models.DateTimeField(null=True, blank=True, verbose_name="Ngày hết hạn")
    project = models.ForeignKey(Project, related_name='tasks', on_delete=models.CASCADE, verbose_name="Dự án")
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='assigned_tasks', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Người được giao")    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")
    
    def __str__(self):
        return self.title

# MODEL COMMENT (các bình luận)
class Comment(models.Model):
    task = models.ForeignKey(Task, related_name='comments', on_delete=models.CASCADE, verbose_name="Công việc")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='comments', on_delete=models.CASCADE, verbose_name="Tác giả")
    body = models.TextField(verbose_name="Nội dung bình luận")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")
    
    def __str__(self):
        return f'Comment by {self.author.username} on {self.task.title}'

# MODEL ATTACHMENT (các tập tin đính kèm)
class Attachment(models.Model):
    task = models.ForeignKey(Task, related_name='attachments', on_delete=models.CASCADE, verbose_name="Công việc")
    file = models.FileField(upload_to='attachments/', verbose_name="Tập tin")
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name="Mô tả tập tin")   
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='attachments', on_delete=models.SET_NULL, null=True, verbose_name="Người tải lên")    
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tải lên")
    
    def __str__(self):
        return f'Attachment for {self.task.title}'

# MODEL ACTIVITYLOG (nhật ký hoạt động)
class ActivityLog(models.Model):
    action_description = models.CharField(max_length=255, verbose_name="Hành động")   
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='activity_logs', on_delete=models.SET_NULL, null=True, verbose_name="Người thực hiện")
    project = models.ForeignKey(Project, related_name='activity_logs', on_delete=models.SET_NULL, null=True, verbose_name="Dự án")
    task = models.ForeignKey(Task, related_name='activity_logs', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Công việc")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian")
   
    def __str__(self):
        return f'{self.actor.username} {self.action_description} at {self.timestamp.strftime("%Y-%m-%d %H:%M")}'