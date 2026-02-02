from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
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

from .models import User, Project, Task, Comment, Attachment, ActivityLog, PasswordResetToken
from .serializers import (
    SignupSerializer, 
    UserSerializer, 
    ProjectSerializer, 
    UserBasicSerializer,
    TaskSerializer, 
    CommentSerializer, 
    AttachmentSerializer, 
    ActivityLogSerializer,
    GoogleLoginSerializer,
    SetPasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .permissions import (
    CanViewProjectList,
    IsProjectOwnerOrMember,
    CanViewTaskList,
    IsTaskPermission,
    IsCommentOrAttachmentOwner,
    CanViewActivityLog,
    IsProjectOwnerOnly,
)
from .filters import TaskFilter, ProjectFilter, UserFilter

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings


def create_activity_log(user, action_description, project=None, task=None):
    ActivityLog.objects.create(
        actor=user,
        action_description=action_description,
        project=project,
        task=task
    )


# SIGNUP
class SignupView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        user = SignupSerializer(data=request.data)
        if user.is_valid():
            user.save()
            return Response(user.data, status=status.HTTP_201_CREATED)
        return Response(user.errors, status=status.HTTP_400_BAD_REQUEST)


# LOGIN
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


# SET PASSWORD (cho user Google hoặc user muốn set password lần đầu)
class SetPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Kiểm tra xem user đã có mật khẩu chưa
        if request.user.has_usable_password():
            return Response(
                {"error": "Tài khoản của bạn đã có mật khẩu. Nếu muốn đổi mật khẩu, vui lòng sử dụng chức năng 'Đổi mật khẩu'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set mật khẩu mới
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response(
            {"message": "Mật khẩu đã được thiết lập thành công. Bạn có thể đăng nhập bằng username/email và mật khẩu này."},
            status=status.HTTP_200_OK
        )


# FORGOT PASSWORD (Bước 1: User nhập email)
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Trả về thông báo chung để tránh leak thông tin user
            return Response(
                {"message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn reset mật khẩu."},
                status=status.HTTP_200_OK
            )
        
        # ❗ CHẶN USER GOOGLE CHƯA CÓ PASSWORD
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
        
        # Xóa token cũ (nếu có) để tránh spam
        PasswordResetToken.objects.filter(user=user, is_used=False).delete()
        
        # Tạo token mới với hết hạn 24 giờ
        expires_at = timezone.now() + timedelta(hours=24)
        reset_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=expires_at
        )
        
        # Lấy Frontend URL từ settings (đã config trong .env)
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


# RESET PASSWORD (Bước 2: User set password mới với token)
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    
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
        
        # Kiểm tra token đã hết hạn chưa
        if reset_token.expires_at < timezone.now():
            return Response(
                {"error": "Token đã hết hạn. Vui lòng yêu cầu reset mật khẩu mới."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set mật khẩu mới
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        # Đánh dấu token đã sử dụng
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
        return Response({"message": f"Đã xóa {user.username} khỏi dự án."}, status=status.HTTP_200_OK)



# 1. API CHO TASK DỰ ÁN (Project Tasks)
class TaskListView(APIView):
    permission_classes = [IsAuthenticated, CanViewTaskList]
    def get(self, request, pk):
        # Lấy task thuộc dự án này VÀ không phải task cá nhân
        task = self.permission_classes[1]().filter_queryset(request, pk)
        filterset = TaskFilter(request.GET, queryset=task, request=request)
        if filterset.is_valid():
            task = filterset.qs
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

        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            # --- ÉP LUẬT: TASK DỰ ÁN ---
            task = serializer.save(
                project=project,       # BẮT BUỘC CÓ PROJECT
                is_personal=False,     # BẮT BUỘC FALSE
                created_by=request.user
            )
            create_activity_log(request.user, f"Tạo công việc '{task.title}'", project=project, task=task)
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# 2. API CHO TASK CÁ NHÂN (Personal Tasks)
class PersonalTaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Chỉ lấy task do mình tạo VÀ là task cá nhân
        tasks = Task.objects.filter(created_by=request.user, is_personal=True)
        filterset = TaskFilter(request.GET, queryset=tasks, request=request)
        if filterset.is_valid():
            tasks = filterset.qs
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            # --- ÉP LUẬT: TASK CÁ NHÂN ---
            task = serializer.save(
                project=None,          # BẮT BUỘC NULL
                is_personal=True,      # BẮT BUỘC TRUE
                created_by=request.user,
                assignee=request.user  # Task cá nhân thì tự giao cho mình luôn
            )
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# 3. GENERIC TASK DETAIL (Dùng chung)
class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTaskPermission]

    # Bỏ tham số project_pk, chỉ cần pk của task
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
        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
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
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
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
        task.delete()
        if project:
            create_activity_log(request.user, f"đã xóa công việc '{task_title}'", project=project)
        return Response(status=status.HTTP_204_NO_CONTENT)


# COMMENT LIST / CREATE
class CommentListView(APIView):
    permission_classes = [IsAuthenticated, IsTaskPermission]
    def get(self, request, task_pk):
        try:
            task = Task.objects.get(pk=task_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, task)
        comments = Comment.objects.filter(task=task)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, task_pk):
        try:
            task = Task.objects.get(pk=task_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, task)
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save(author=request.user, task=task)
            create_activity_log(request.user, f"Thêm bình luận vào '{task.title}'", project=task.project, task=task)
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
