from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.db.models import Q
from .models import Project, Task


# Phân quyền ProjectList 
class CanViewProjectList(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def filter_queryset(self, request):
        user = request.user
        if user.is_staff:
            return Project.objects.all()
        return Project.objects.filter(Q(owner=user) | Q(members=user)).distinct()


# Phân quyền ProjectDetail
class IsProjectOwnerOrMember(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in SAFE_METHODS:
            return request.user in obj.members.all() or request.user == obj.owner
        return request.user == obj.owner


# Phân quyền TaskList (Dành cho danh sách task trong dự án)
class CanViewTaskList(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def filter_queryset(self, request, project_pk):
        user = request.user
        if user.is_staff:
            return Task.objects.filter(project_id=project_pk)
        
        # Chỉ lấy task thuộc dự án VÀ không phải task cá nhân
        return Task.objects.filter(
            Q(project__id=project_pk, project__members=user) | 
            Q(project__id=project_pk, project__owner=user)
        ).filter(is_personal=False).distinct()


# Phân quyền TaskDetail (Xử lý cả Task cá nhân và Task dự án)
class IsTaskPermission(BasePermission):
    """
    - Task Cá nhân: Chỉ người tạo (created_by) mới có quyền.
    - Task Dự án: Chủ project full quyền, Member/Assignee xem+sửa (nhưng không được giao task).
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff: return True

        # --- CASE 1: TASK CÁ NHÂN ---
        if obj.is_personal:
            # Chỉ người tạo mới được xem/sửa/xóa
            return obj.created_by == user

        # --- CASE 2: TASK DỰ ÁN ---
        if obj.project:
            project = obj.project
            is_owner = user == project.owner
            is_member = user in project.members.all()
            is_assignee = user == obj.assignee
            
            # Debug logging
            print(f"🔍 Permission Debug:")
            print(f"   User: {user.id} - {user.username}")
            print(f"   Project Owner: {project.owner.id} - {project.owner.username}")
            print(f"   is_owner: {is_owner}")
            print(f"   is_member: {is_member}")
            print(f"   Method: {request.method}")
            print(f"   Request data: {request.data}")

            if request.method in SAFE_METHODS:
                return is_owner or is_member or is_assignee
            
            if request.method == 'POST':
                # Cho phép chủ dự án, thành viên hoặc người được giao việc tạo comment/attachment
                return is_owner or is_member or is_assignee
            
            if request.method in ['PUT', 'PATCH']:
                # Chỉ có chủ dự án mới được phép giao/thay đổi assignee
                if 'assignee_id' in request.data or 'assignee' in request.data:
                    print(f"   Assignee change request - is_owner: {is_owner}")
                    return is_owner
                # Member và assignee chỉ được sửa description, status, priority, due_date
                return is_owner or is_member or is_assignee
            
            if request.method == 'DELETE':
                return is_owner # Chỉ chủ dự án mới được xóa task dự án
        
        return False


# Phân quyền Comment/Attachment Detail
class IsCommentOrAttachmentOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff:
            return True
        
        # Nếu task cá nhân, chỉ chủ task được xử lý
        if obj.task.is_personal:
            return obj.task.created_by == user

        project = obj.task.project
        is_owner = user == project.owner
        is_member = user in project.members.all()
        author_or_uploader = getattr(obj, 'author', None) or getattr(obj, 'uploader', None)
        is_author = user == author_or_uploader
        if request.method in SAFE_METHODS:
            return is_owner or is_member
        # Sửa/xóa: chỉ người bình luận hoặc chủ dự án (admin đã xử lý ở trên)
        return is_author or is_owner


# Phân quyền bình luận trên task
class CanCommentOnTask(BasePermission):
    """
    Cho phép bình luận trên task:
    - Task Cá nhân: Chỉ người tạo và assignee có thể bình luận
    - Task Dự án: Tất cả thành viên dự án có thể bình luận
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff:
            return True
        
        # Task cá nhân: chỉ người tạo và assignee
        if obj.is_personal:
            is_creator = obj.created_by == user
            is_assignee = obj.assignee == user
            return is_creator or is_assignee
        
        # Task dự án: tất cả thành viên
        if obj.project:
            is_owner = user == obj.project.owner
            is_member = user in obj.project.members.all()
            return is_owner or is_member
        
        return False


# Phân quyền ActivityLog View
class CanViewActivityLog(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


# Phân quyền quản lý thành viên dự án
class IsProjectOwnerOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return request.user.id == obj.owner.id