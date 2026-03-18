from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import render
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
import os
import uuid

from .models import User, Project, Task, Comment, Attachment, ActivityLog, PasswordResetToken, Notification
from .serializers import (
    SignupSerializer, 
    UserSerializer, 
    ProjectSerializer, 
    UserBasicSerializer,
    UserAdminSerializer,
    TaskSerializer, 
    CommentSerializer, 
    AttachmentSerializer, 
    ActivityLogSerializer,
    GoogleLoginSerializer,
    SetPasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    NotificationSerializer,
)
from .permissions import (
    CanViewProjectList,
    IsProjectOwnerOrMember,
    CanViewTaskList,
    IsTaskPermission,
    IsCommentOrAttachmentOwner,
    CanCommentOnTask,
    CanViewActivityLog,
    IsProjectOwnerOnly,
)
from .filters import TaskFilter, ProjectFilter, UserFilter

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

# Import email utils
from .email_utils import (
    send_task_assigned_notification, 
    send_project_invitation_notification,
    send_task_due_date_changed_notification,
    send_task_comment_notification,
    send_task_deleted_notification,
    send_task_status_changed_notification,
    send_member_removed_notification,
)


def create_activity_log(user, action_description, project=None, task=None):
    ActivityLog.objects.create(
        actor=user,
        action_description=action_description,
        project=project,
        task=task
    )


def create_notification(recipient, title, message, project=None, task=None):
    """
    Helper function để tạo Notification
    Tránh tạo ở nhiều nơi, tập trung logic ở một chỗ
    """
    Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        project=project,
        task=task
    )


# SIGNUP
class SignupView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        user = SignupSerializer(data=request.data)
        if user.is_valid():
            user.save()
            return Response(user.data, status=status.HTTP_201_CREATED)
        return Response(user.errors, status=status.HTTP_400_BAD_REQUEST)


# LOGIN 
class LoginView(TokenObtainPairView):
    from .serializers import CustomTokenObtainPairSerializer
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


# SET PASSWORD 
class SetPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.has_usable_password():
            return Response(
                {"error": "Tài khoản của bạn đã có mật khẩu. Nếu muốn đổi mật khẩu, vui lòng sử dụng chức năng 'Đổi mật khẩu'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response(
            {"message": "Mật khẩu đã được thiết lập thành công. Bạn có thể đăng nhập bằng username/email và mật khẩu này."},
            status=status.HTTP_200_OK
        )


# FORGOT PASSWORD
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn reset mật khẩu."},
                status=status.HTTP_200_OK
            )
        
        # CHẶN USER GOOGLE CHƯA CÓ PASSWORD
        if not user.has_usable_password():
            return Response(
                {
                    "error": (
                        "Tài khoản này đăng ký bằng Google. "
                        "Vui lòng đăng nhập bằng Google hoặc thiết lập mật khẩu trước."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        PasswordResetToken.objects.filter(user=user, is_used=False).delete()
        expires_at = timezone.now() + timedelta(hours=24)
        reset_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=expires_at
        )
        
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password?token={reset_token.token}"
        
        subject = "Yêu cầu Reset Mật khẩu"
        message = f"""
        Xin chào {user.first_name or user.username},
        
        Bạn đã yêu cầu reset mật khẩu cho tài khoản của mình.
        Click vào link dưới đây để set mật khẩu mới (link sẽ hết hạn sau 24 giờ):
        
        {reset_link}
        
        Nếu bạn không yêu cầu này, vui lòng bỏ qua email này.
        
        Best regards,
        Task Management System
        """
        
        try:
            send_mail(
                subject,
                message,
                'noreply@taskmanagementsystem.com',
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email sending error: {str(e)}")
            return Response(
                {"error": "Không thể gửi email. Vui lòng thử lại sau."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(
            {"message": "Email reset mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn."},
            status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token, is_used=False)
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"error": "Token không hợp lệ hoặc đã hết hạn."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if reset_token.expires_at < timezone.now():
            return Response(
                {"error": "Token đã hết hạn. Vui lòng yêu cầu reset mật khẩu mới."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        reset_token.is_used = True
        reset_token.save()
        
        return Response(
            {"message": "Mật khẩu đã được reset thành công. Bạn có thể đăng nhập với mật khẩu mới."},
            status=status.HTTP_200_OK
        )


# USER LIST
class UserListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        queryset = User.objects.all().only('id', 'username', 'first_name', 'last_name', 'email')
        filterset = UserFilter(request.GET, queryset=queryset, request=request)
        if filterset.is_valid():
            queryset = filterset.qs
        serializer = UserBasicSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# USER DETAIL
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            raise NotFound("Người dùng không tồn tại.")
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# CURRENT USER (ME)
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ADMIN USER MANAGEMENT
class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        serializer = UserAdminSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            raise NotFound("Người dùng không tồn tại.")
        serializer = UserAdminSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            raise NotFound("Người dùng không tồn tại.")
        
        # Không cho phép thay đổi chính mình
        if user.id == request.user.id:
            return Response(
                {"detail": "Không thể thay đổi quyền của chính mình."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = UserAdminSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            raise NotFound("Người dùng không tồn tại.")
        
        # Không cho phép xóa chính mình
        if user.id == request.user.id:
            return Response(
                {"detail": "Không thể xóa chính mình."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# PROJECT LIST / CREATE
class ProjectListView(APIView):
    permission_classes = [IsAuthenticated, CanViewProjectList]
    def get(self, request):
        project = self.permission_classes[1]().filter_queryset(request)
        filterset = ProjectFilter(request.GET, queryset=project, request=request)
        if filterset.is_valid():
            project = filterset.qs
        serializer = ProjectSerializer(project, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(owner=request.user)
            project.members.add(request.user)
            
            # Tự động thêm tất cả admin (is_staff=True) vào dự án mới
            admin_users = User.objects.filter(is_staff=True)
            for admin in admin_users:
                if admin.id != request.user.id:  # Không thêm lại nếu owner đã là admin
                    project.members.add(admin)
            
            create_activity_log(request.user, f"Tạo dự án mới: {project.name}", project=project)
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# PROJECT DETAIL
class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated, IsProjectOwnerOrMember]
    def get(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Dự án không tồn tại.")
        self.check_object_permissions(request, project)
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Dự án không tồn tại.")
        self.check_object_permissions(request, project)
        serializer = ProjectSerializer(project, data=request.data)
        if serializer.is_valid():
            serializer.save()
            create_activity_log(request.user, f"đã cập nhật thông tin dự án '{project.name}'", project=project)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Dự án không tồn tại.")
        self.check_object_permissions(request, project)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            create_activity_log(request.user, f"đã cập nhật một phần dự án '{project.name}'", project=project)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Dự án không tồn tại.")
        self.check_object_permissions(request, project)
        project_name = project.name
        project.delete()
        create_activity_log(request.user, f"đã xóa dự án '{project_name}'")
        return Response(status=status.HTTP_204_NO_CONTENT)


# ADD MEMBER
class AddMemberView(APIView):
    permission_classes = [IsAuthenticated, IsProjectOwnerOnly]
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Dự án không tồn tại.")
        self.check_object_permissions(request, project)
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "Thiếu user_id."}, status=status.HTTP_400_BAD_REQUEST)        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "Người dùng không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        if user in project.members.all():
            return Response({"message": f"{user.username} đã là thành viên."}, status=status.HTTP_200_OK)
              
        project.members.add(user)
        create_activity_log(request.user, f"Thêm thành viên '{user.username}' vào dự án '{project.name}'", project=project)
        
        # Tạo thông báo cho user được thêm vào dự án
        create_notification(
            recipient=user,
            title="Bạn đã được thêm vào dự án mới",
            message=f"Bạn vừa được {request.user.username} thêm vào dự án '{project.name}'.",
            project=project
        )
        
        # Gửi email thông báo mời vào dự án
        send_project_invitation_notification(project, request.user, user)
        
        return Response({"message": f"Đã thêm {user.username} vào dự án."}, status=status.HTTP_200_OK)


# REMOVE MEMBER
class RemoveMemberView(APIView):
    permission_classes = [IsAuthenticated, IsProjectOwnerOnly]
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Dự án không tồn tại.")
        self.check_object_permissions(request, project)
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "Thiếu user_id."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "Người dùng không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        if user == project.owner:
            return Response({"error": "Không thể xóa chủ dự án."}, status=status.HTTP_400_BAD_REQUEST)
        if user not in project.members.all():
            return Response({"message": f"{user.username} không phải là thành viên."}, status=status.HTTP_200_OK)
        project.members.remove(user)
        create_activity_log(request.user, f"Xóa thành viên '{user.username}' khỏi dự án '{project.name}'", project=project)
        
        # Gửi email thông báo xóa thành viên
        send_member_removed_notification(project, request.user, user)
        
        # Tạo thông báo cho user bị xóa
        create_notification(
            recipient=user,
            title="Bạn đã bị xóa khỏi dự án",
            message=f"Bạn đã bị {request.user.username} xóa khỏi dự án '{project.name}'.",
            project=None  # Không liên kết với project nữa
        )
        
        return Response({"message": f"Đã xóa {user.username} khỏi dự án."}, status=status.HTTP_200_OK)



# Project Tasks
class TaskListView(APIView):
    permission_classes = [IsAuthenticated, CanViewTaskList]
    def get(self, request, pk):
        task = self.permission_classes[1]().filter_queryset(request, pk)
        try:
            filterset = TaskFilter(request.GET, queryset=task, request=request)
            if filterset.is_valid():
                task = filterset.qs
            else:
                task = filterset.queryset
        except Exception as e:
            task = Task.objects.filter(project_id=pk, is_personal=False)
        serializer = TaskSerializer(task, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"error": "Dự án không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        # Check quyền: Phải là member hoặc owner mới được tạo task
        if request.user != project.owner and request.user not in project.members.all():
             return Response({"error": "Bạn không có quyền tạo task trong dự án này."}, status=status.HTTP_403_FORBIDDEN)

        serializer = TaskSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            task = serializer.save(
                project=project,       # BẮT BUỘC CÓ PROJECT
                is_personal=False,   
                created_by=request.user
            )
            create_activity_log(request.user, f"Tạo công việc '{task.title}'", project=project, task=task)
            
            # Gửi email nếu task được tạo với assignee
            if task.assignee and task.assignee != request.user:
                send_task_assigned_notification(task, task.assignee, request.user)
            
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# Personal Tasks
class PersonalTaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(created_by=request.user, is_personal=True)
        filterset = TaskFilter(request.GET, queryset=tasks, request=request)
        if filterset.is_valid():
            tasks = filterset.qs
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TaskSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            task = serializer.save(
                project=None,          # BẮT BUỘC NULL
                is_personal=True,     
                created_by=request.user,
                assignee=request.user  
            )
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# All Assigned Tasks (personal + project tasks assigned to user)
class AssignedTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        # Get all tasks assigned to user OR created by user (personal tasks)
        tasks = Task.objects.filter(
            Q(assignee=request.user) | Q(created_by=request.user, is_personal=True)
        ).distinct()
        filterset = TaskFilter(request.GET, queryset=tasks, request=request)
        if filterset.is_valid():
            tasks = filterset.qs
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# GENERIC TASK DETAIL 
class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTaskPermission]

    def get(self, request, pk): 
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            raise NotFound("Công việc không tồn tại.")
        self.check_object_permissions(request, task)
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            raise NotFound("Công việc không tồn tại.")
        self.check_object_permissions(request, task)
        
        # Lưu giá trị cũ để so sánh
        old_due_date = task.due_date
        old_status = task.status
        old_assignee = task.assignee
        
        serializer = TaskSerializer(task, data=request.data, context={'request': request})
        if serializer.is_valid():
            updated_task = serializer.save()
            
            # Xác định người nhận thông báo
            recipients = set()
            if updated_task.assignee:
                recipients.add(updated_task.assignee)
            if updated_task.created_by:
                recipients.add(updated_task.created_by)
            if updated_task.project:
                for member in updated_task.project.members.all():
                    recipients.add(member)
            
            # Gửi email khi thay đổi assignee
            if old_assignee != updated_task.assignee and updated_task.assignee:
                send_task_assigned_notification(updated_task, updated_task.assignee, request.user)
            
            # Gửi email khi thay đổi due_date
            if old_due_date != updated_task.due_date:
                send_task_due_date_changed_notification(updated_task, request.user, old_due_date, recipients)
            
            # Gửi email khi thay đổi status
            if old_status != updated_task.status:
                send_task_status_changed_notification(updated_task, request.user, old_status, recipients)
            
            if not task.is_personal:
                create_activity_log(request.user, f"đã cập nhật công việc '{task.title}'", project=task.project, task=task)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            raise NotFound("Công việc không tồn tại.")
        self.check_object_permissions(request, task)
        
        # Lưu giá trị cũ để so sánh
        old_due_date = task.due_date
        old_status = task.status
        old_assignee = task.assignee
        
        serializer = TaskSerializer(task, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_task = serializer.save()
            
            # Xác định người nhận thông báo
            recipients = set()
            if updated_task.assignee:
                recipients.add(updated_task.assignee)
            if updated_task.created_by:
                recipients.add(updated_task.created_by)
            if updated_task.project:
                for member in updated_task.project.members.all():
                    recipients.add(member)
            
            # Gửi email khi thay đổi assignee
            if old_assignee != updated_task.assignee and updated_task.assignee:
                send_task_assigned_notification(updated_task, updated_task.assignee, request.user)
            
            # Gửi email khi thay đổi due_date
            if old_due_date != updated_task.due_date:
                send_task_due_date_changed_notification(updated_task, request.user, old_due_date, recipients)
            
            # Gửi email khi thay đổi status
            if old_status != updated_task.status:
                send_task_status_changed_notification(updated_task, request.user, old_status, recipients)
            
            if not task.is_personal:
                create_activity_log(request.user, f"đã cập nhật một phần công việc '{task.title}'", project=task.project, task=task)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            raise NotFound("Công việc không tồn tại.")
        self.check_object_permissions(request, task)
        
        task_title = task.title
        project = task.project
        
        # Xác định người nhận email thông báo xóa
        recipients = set()
        if task.assignee:
            recipients.add(task.assignee)
        if task.created_by:
            recipients.add(task.created_by)
        if project:
            for member in project.members.all():
                recipients.add(member)
        
        # Gửi email thông báo xóa task
        if recipients:
            send_task_deleted_notification(task_title, project, request.user, recipients)
        
        task.delete()
        if project:
            create_activity_log(request.user, f"đã xóa công việc '{task_title}'", project=project)
        return Response(status=status.HTTP_204_NO_CONTENT)


# COMMENT LIST / CREATE
class CommentListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_pk):
        try:
            task = Task.objects.get(pk=task_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        # Kiểm tra quyền xem task
        permission = IsTaskPermission()
        if not permission.has_object_permission(request, self, task):
            return Response({"error": "Bạn không có quyền xem công việc này."}, status=status.HTTP_403_FORBIDDEN)
        
        comments = Comment.objects.filter(task=task)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, task_pk):
        try:
            task = Task.objects.get(pk=task_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        # Kiểm tra quyền bình luận trên task
        permission = CanCommentOnTask()
        if not permission.has_object_permission(request, self, task):
            return Response({"error": "Bạn không có quyền bình luận trên công việc này."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save(author=request.user, task=task)
            create_activity_log(request.user, f"Thêm bình luận vào '{task.title}'", project=task.project, task=task)
            
            # Tối ưu: Dùng set để tracking người nhận notification (tự động loại bỏ trùng lặp)
            recipients_to_notify = set()
            
            # Thêm assignee vào danh sách nhận (nếu không phải người bình luận)
            if task.assignee and task.assignee != request.user:
                recipients_to_notify.add(task.assignee)
            
            # Thêm người tạo task vào danh sách nhận (nếu không phải người bình luận)
            if task.created_by and task.created_by != request.user:
                recipients_to_notify.add(task.created_by)
            
            # Gửi thông báo cho tất cả người trong danh sách (tránh lặp code)
            if recipients_to_notify:
                comment_preview = comment.body[:50] + ("..." if len(comment.body) > 50 else "")
                title = f"Bình luận mới trong công việc '{task.title}'"
                message = f"{request.user.username} đã bình luận: \"{comment_preview}\""
                
                for recipient in recipients_to_notify:
                    create_notification(
                        recipient=recipient,
                        title=title,
                        message=message,
                        project=task.project,
                        task=task
                    )
                
                # Gửi email thông báo bình luận mới
                send_task_comment_notification(task, comment, request.user, recipients_to_notify)
            
            return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# COMMENT DETAIL
class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCommentOrAttachmentOwner]
    def get(self, request, task_pk, pk):
        try:
            comment = Comment.objects.get(pk=pk, task__pk=task_pk)
        except Comment.DoesNotExist:
            raise NotFound("Bình luận không tồn tại.")
        self.check_object_permissions(request, comment)
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, task_pk, pk):
        try:
            comment = Comment.objects.get(pk=pk, task__pk=task_pk)
        except Comment.DoesNotExist:
            raise NotFound("Bình luận không tồn tại.")
        self.check_object_permissions(request, comment)
        serializer = CommentSerializer(comment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, task_pk, pk):
        try:
            comment = Comment.objects.get(pk=pk, task__pk=task_pk)
        except Comment.DoesNotExist:
            raise NotFound("Bình luận không tồn tại.")
        self.check_object_permissions(request, comment)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ATTACHMENT LIST / CREATE
class AttachmentListView(APIView):
    permission_classes = [IsAuthenticated, IsTaskPermission]
    parser_classes = [MultiPartParser, FormParser]
    def get(self, request, task_pk):
        try:
            task = Task.objects.get(pk=task_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, task)
        attachments = Attachment.objects.filter(task=task)
        serializer = AttachmentSerializer(attachments, many=True)
        return Response(serializer.data)
    
    def post(self, request, task_pk):
        try:
            task = Task.objects.get(pk=task_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, task)
        serializer = AttachmentSerializer(data=request.data)
        if serializer.is_valid():
            attachment = serializer.save(uploader=request.user, task=task)
            create_activity_log(request.user, f"Tải lên tệp cho '{task.title}'", project=task.project, task=task)
            return Response(AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ATTACHMENT DETAIL
class AttachmentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCommentOrAttachmentOwner]
    def get(self, request, task_pk, pk):
        try:
            attachment = Attachment.objects.get(pk=pk, task__pk=task_pk)
        except Attachment.DoesNotExist:
            raise NotFound("Tệp đính kèm không tồn tại.")
        self.check_object_permissions(request, attachment)
        serializer = AttachmentSerializer(attachment)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def delete(self, request, task_pk, pk):
        try:
            attachment = Attachment.objects.get(pk=pk, task__pk=task_pk)
        except Attachment.DoesNotExist:
            raise NotFound("Tệp đính kèm không tồn tại.")
        self.check_object_permissions(request, attachment)
        task = attachment.task
        if attachment.file:
            attachment.file.delete(save=False)
        attachment.delete()
        create_activity_log(request.user, f"đã xóa một tệp đính kèm khỏi công việc '{task.title}'", project=task.project, task=task)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ACTIVITY LOG
class ActivityLogProjectView(APIView):
    permission_classes = [IsAuthenticated, IsProjectOwnerOrMember]
    def get(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"error": "Dự án không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, project)
        logs = ActivityLog.objects.filter(project=project).order_by('-timestamp')
        return Response(ActivityLogSerializer(logs, many=True).data)


class ActivityLogTaskView(APIView):
    permission_classes = [IsAuthenticated, IsTaskPermission]
    def get(self, request, task_pk):
        try:
            task = Task.objects.get(pk=task_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, task)
        logs = ActivityLog.objects.filter(task=task).order_by('-timestamp')
        return Response(ActivityLogSerializer(logs, many=True).data)
    
    
# LOGIN GOOGLE
class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token = serializer.validated_data['id_token']
        GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID

        try:
            # 1. Verify token với Google
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )

            # 2. Kiểm tra email đã được xác thực chưa
            if not idinfo.get('email_verified'):
                return Response(
                    {"error": "Email Google chưa được xác thực."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. Lấy thông tin user từ Google
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            if not email:
                return Response(
                    {"error": "Không lấy được email từ Google."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 4. Tạo hoặc lấy user theo email
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': f"{email.split('@')[0]}_{uuid.uuid4().hex[:4]}",
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )

            # Nếu user đã tồn tại → cập nhật thông tin
            if not created:
                updated = False
                if user.first_name != first_name:
                    user.first_name = first_name
                    updated = True
                if user.last_name != last_name:
                    user.last_name = last_name
                    updated = True
                if updated:
                    user.save()

            # 5. Nếu là user Google mới → set unusable password
            if created:
                user.set_unusable_password()
                user.save()

            # 6. Tạo JWT token
            refresh = RefreshToken.for_user(user)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {"error": "Token Google không hợp lệ hoặc đã hết hạn."},
                status=status.HTTP_400_BAD_REQUEST
            )

# NOTIFICATION LIST
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Lấy tất cả notification của user, order by created_at desc
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        
        # Trả về cùng lúc số lượng chưa đọc
        unread_count = notifications.filter(is_read=False).count()
        
        return Response({
            'unread_count': unread_count,
            'notifications': serializer.data
        }, status=status.HTTP_200_OK)


# NOTIFICATION MARK AS READ
class NotificationMarkAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Thông báo không tồn tại."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        notification.is_read = True
        notification.save()
        
        return Response(
            {"message": "Thông báo đã được đánh dấu là đã đọc."},
            status=status.HTTP_200_OK
        )


# NOTIFICATION MARK ALL AS READ
class NotificationMarkAllAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Đánh dấu tất cả notification của user là đã đọc
        updated_count = Notification.objects.filter(
            recipient=request.user, 
            is_read=False
        ).update(is_read=True)
        
        return Response(
            {"message": f"Đã đánh dấu {updated_count} thông báo là đã đọc."},
            status=status.HTTP_200_OK
        )