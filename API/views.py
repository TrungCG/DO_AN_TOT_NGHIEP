from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import render

from .models import User, Project, Task, Comment, Attachment, ActivityLog
from .serializers import (
    SignupSerializer, UserSerializer, ProjectSerializer, UserBasicSerializer,
    TaskSerializer, CommentSerializer, AttachmentSerializer, ActivityLogSerializer
)
from .permissions import (
    CanViewProjectList,
    IsProjectOwnerOrMember,
    CanViewTaskList,
    IsTaskPermission,
    CanViewCommentOrAttachmentList,
    IsCommentOrAttachmentOwner,
    CanViewActivityLog,
    IsProjectOwnerOnly,
)
from .filters import TaskFilter, ProjectFilter, UserFilter


# Hàm tiện ích để tạo bản ghi nhật ký hoạt động
def create_activity_log(user, action_description, project=None, task=None):
    ActivityLog.objects.create(
        actor=user,
        action_description=action_description,
        project=project,
        task=task
    )


# SIGNUP (đăng ký người dùng)
class SignupView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        user = SignupSerializer(data=request.data)
        if user.is_valid():
            user.save()
            return Response(user.data, status=status.HTTP_201_CREATED)
        return Response(user.errors, status=status.HTTP_400_BAD_REQUEST)


# LOGIN VIEW (đăng nhập người dùng và lấy JWT)
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


# USER LIST VIEW (danh sách người dùng)
class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = User.objects.all().only('id', 'username', 'first_name', 'last_name', 'email')
        filterset = UserFilter(request.GET, queryset=queryset, request=request)
        if filterset.is_valid():
            queryset = filterset.qs

        serializer = UserBasicSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# USER DETAIL VIEW (hiển thị chi tiết người dùng)
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            raise NotFound("Người dùng không tồn tại.")
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# PROJECT LIST / CREATE VIEW (danh sách/tạo dự án)
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
            create_activity_log(
                request.user, 
                f"Tạo dự án mới: {project.name}", 
                project=project
            )
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# PROJECT DETAIL VIEW (chi tiết dự án)
class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated, IsProjectOwnerOrMember]
    def get(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Dự án không tồn tại.")
        # Kiểm tra object-level permission
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
            create_activity_log(
                request.user, 
                f"đã cập nhật thông tin dự án '{project.name}'", 
                project=project
            )
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
            create_activity_log(
                request.user, 
                f"đã cập nhật một phần dự án '{project.name}'", 
                project=project
            )
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
        create_activity_log(
            request.user, 
            f"đã xóa dự án '{project_name}'"
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


#  ADD MEMBER VIEW (thêm thành viên vào dự án)
class AddMemberView(APIView):
    permission_classes = [IsAuthenticated, IsProjectOwnerOnly]
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Dự án không tồn tại.")
        self.check_object_permissions(request, project)# Kiểm tra quyền của chủ dự án
        user_id = request.data.get("user_id")# 
        if not user_id:
            return Response({"error": "Thiếu user_id trong dữ liệu gửi lên."}, status=status.HTTP_400_BAD_REQUEST)        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "Người dùng không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        if user in project.members.all():
            return Response({"message": f"{user.username} đã là thành viên của dự án."}, status=status.HTTP_200_OK)
              
        project.members.add(user)
        create_activity_log(request.user, f"Thêm thành viên '{user.username}' vào dự án '{project.name}'", project=project)
        return Response({"message": f"Đã thêm {user.username} vào dự án."}, status=status.HTTP_200_OK)


# REMOVE MEMBER VIEW (xóa thành viên khỏi dự án)
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
            return Response({"error": "Thiếu user_id trong dữ liệu gửi lên."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "Người dùng không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

        if user == project.owner:
            return Response({"error": "Không thể xóa chủ dự án."}, status=status.HTTP_400_BAD_REQUEST)
        if user not in project.members.all():
            return Response({"message": f"{user.username} không phải là thành viên của dự án."}, status=status.HTTP_200_OK)

        project.members.remove(user)
        create_activity_log(request.user, f"Xóa thành viên '{user.username}' khỏi dự án '{project.name}'", project=project)
        return Response({"message": f"Đã xóa {user.username} khỏi dự án."}, status=status.HTTP_200_OK)


# TASK LIST / CREATE VIEW (danh sách/tạo công việc)
class TaskListView(APIView):
    permission_classes = [IsAuthenticated, CanViewTaskList]
    def get(self, request, pk):
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
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            task = serializer.save(project=project)
            create_activity_log(
                request.user,
                f"Tạo công việc '{task.title}'",
                project=project,
                task=task
            )
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# TASK DETAIL VIEW (chi tiết công việc)
class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTaskPermission]

    def get(self, request, project_pk, pk):
        try:
            task = Task.objects.get(pk=pk, project_id=project_pk)
        except Task.DoesNotExist:
            raise NotFound("Công việc không tồn tại.")
        self.check_object_permissions(request, task)
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, project_pk, pk):
        try:
            task = Task.objects.get(pk=pk, project_id=project_pk)
        except Task.DoesNotExist:
            raise NotFound("Công việc không tồn tại.")
        self.check_object_permissions(request, task)
        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            create_activity_log(
                request.user, 
                f"đã cập nhật công việc '{task.title}'", 
                project=task.project, 
                task=task
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, project_pk, pk):
        try:
            task = Task.objects.get(pk=pk, project_id=project_pk)
        except Task.DoesNotExist:
            raise NotFound("Công việc không tồn tại.")
        self.check_object_permissions(request, task)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            create_activity_log(
                request.user, 
                f"đã cập nhật một phần công việc '{task.title}'", 
                project=task.project, 
                task=task
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, project_pk, pk):
        try:
            task = Task.objects.get(pk=pk, project_id=project_pk)
        except Task.DoesNotExist:
            raise NotFound("Công việc không tồn tại.")
        self.check_object_permissions(request, task)
        task_title = task.title
        project = task.project
        task.delete()
        create_activity_log(
            request.user, 
            f"đã xóa công việc '{task_title}'", 
            project=project
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# COMMENT LIST / CREATE VIEW (danh sách/tạo bình luận)
class CommentListView(APIView):
    permission_classes = [IsAuthenticated, CanViewCommentOrAttachmentList]
    def get(self, request, project_pk, task_pk):
        try:
            task = Task.objects.get(pk=task_pk, project_id=project_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        comments = Comment.objects.filter(task=task)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, project_pk, task_pk):
        try:
            task = Task.objects.get(pk=task_pk, project_id=project_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save(author=request.user, task=task)
            create_activity_log(
                request.user, 
                f"Thêm bình luận vào '{task.title}'", 
                project=task.project, 
                task=task
            )
            return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# COMMENT DETAIL VIEW (chi tiết bình luận)
class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCommentOrAttachmentOwner]

    def get(self, request, project_pk, task_pk, pk):
        try:
            comment = Comment.objects.get(pk=pk, task__pk=task_pk, task__project_id=project_pk)
        except Comment.DoesNotExist:
            raise NotFound("Bình luận không tồn tại trong công việc này.")
        self.check_object_permissions(request, comment)
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, project_pk, task_pk, pk):
        try:
            comment = Comment.objects.get(pk=pk, task__pk=task_pk, task__project_id=project_pk)
        except Comment.DoesNotExist:
            raise NotFound("Bình luận không tồn tại trong công việc này.")
        self.check_object_permissions(request, comment)
        serializer = CommentSerializer(comment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            try:
                create_activity_log(
                    request.user, 
                    f"đã cập nhật bình luận trong công việc '{comment.task.title}'", 
                    project=comment.task.project, 
                    task=comment.task
                )
            except Exception:
                pass
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, project_pk, task_pk, pk):
        try:
            comment = Comment.objects.get(pk=pk, task__pk=task_pk, task__project_id=project_pk)
        except Comment.DoesNotExist:
            raise NotFound("Bình luận không tồn tại trong công việc này.")
        self.check_object_permissions(request, comment)
        serializer = CommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            try:
                create_activity_log(
                    request.user,
                    f"đã cập nhật một phần bình luận trong công việc '{comment.task.title}'", 
                    project=comment.task.project, 
                    task=comment.task
                )
            except Exception:
                pass
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, project_pk, task_pk, pk):
        try:
            comment = Comment.objects.get(pk=pk, task__pk=task_pk, task__project_id=project_pk)
        except Comment.DoesNotExist:
            raise NotFound("Bình luận không tồn tại trong công việc này.")
        self.check_object_permissions(request, comment)
        task = comment.task
        comment.delete()
        create_activity_log(
            request.user, 
            f"đã xóa một bình luận khỏi công việc '{task.title}'", 
            project=task.project, 
            task=task
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ATTACHMENT LIST / CREATE VIEW (danh sách/tạo tập tin đính kèm)
class AttachmentListView(APIView):
    permission_classes = [IsAuthenticated, CanViewCommentOrAttachmentList]
    parser_classes = [MultiPartParser, FormParser]
    def get(self, request, project_pk, task_pk):
        try:
            task = Task.objects.get(pk=task_pk, project_id=project_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        attachments = Attachment.objects.filter(task=task)
        serializer = AttachmentSerializer(attachments, many=True)
        return Response(serializer.data)
    
    def post(self, request, project_pk, task_pk):
        try:
            task = Task.objects.get(pk=task_pk, project_id=project_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AttachmentSerializer(data=request.data)
        if serializer.is_valid():
            attachment = serializer.save(uploader=request.user, task=task)
            create_activity_log(request.user, f"Tải lên tệp cho '{task.title}'", project=task.project, task=task)
            return Response(AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ATTACHMENT DETAIL VIEW (chi tiết tệp đính kèm)
class AttachmentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCommentOrAttachmentOwner]
    def get(self, request, project_pk, task_pk, pk):
        try:
            attachment = Attachment.objects.get(pk=pk, task__pk=task_pk, task__project_id=project_pk)
        except Attachment.DoesNotExist:
            raise NotFound("Tệp đính kèm không tồn tại trong công việc này.")
        self.check_object_permissions(request, attachment)
        serializer = AttachmentSerializer(attachment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, project_pk, task_pk, pk):
        try:
            attachment = Attachment.objects.get(pk=pk, task__pk=task_pk, task__project_id=project_pk)
        except Attachment.DoesNotExist:
            raise NotFound("Tệp đính kèm không tồn tại trong công việc này.")
        self.check_object_permissions(request, attachment)
        task = attachment.task
        if attachment.file:
            attachment.file.delete(save=False)
        attachment.delete()
        create_activity_log(
            request.user, 
            f"đã xóa một tệp đính kèm khỏi công việc '{task.title}'", 
            project=task.project, 
            task=task
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ACTIVITY LOG VIEW (xem nhật ký hoạt động cho dự án cụ thể)
class ActivityLogProjectView(APIView):
    permission_classes = [IsAuthenticated, CanViewActivityLog]
    def get(self, request, project_pk):
        try:
            project = Project.objects.get(pk=project_pk)
        except Project.DoesNotExist:
            return Response({"error": "Dự án không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        logs = ActivityLog.objects.filter(project=project).order_by('-timestamp')
        return Response(ActivityLogSerializer(logs, many=True).data)


# ACTIVITY LOG VIEW (xem nhật ký hoạt động cho công việc cụ thể)
class ActivityLogTaskView(APIView):
    permission_classes = [IsAuthenticated, CanViewActivityLog]
    def get(self, request, project_pk, task_pk):
        try:
            task = Task.objects.get(pk=task_pk, project_id=project_pk)
        except Task.DoesNotExist:
            return Response({"error": "Công việc không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        logs = ActivityLog.objects.filter(task=task).order_by('-timestamp')
        return Response(ActivityLogSerializer(logs, many=True).data)
    



# # HOMEPAGE VIEW (trang chủ)
# def task_page(request):
#     return render(request, "API/index.html")    
    
