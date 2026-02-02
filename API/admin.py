from django.contrib import admin
from .models import User, Project, Task, Comment, Attachment, ActivityLog, PasswordResetToken, Notification

# Đăng ký các model để hiển thị trong trang admin
admin.site.register(User)
admin.site.register(Project)
admin.site.register(Task)
admin.site.register(Comment)
admin.site.register(Attachment)
admin.site.register(ActivityLog)
admin.site.register(PasswordResetToken)
admin.site.register(Notification)
