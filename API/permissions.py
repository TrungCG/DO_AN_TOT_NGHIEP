from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.db.models import Q
from .models import Project, Task


# Phân quyền ProjectList 
class CanViewProjectList(BasePermission):
    """
    ListView: 
    - Admin: xem tất cả, 
    - Owner hoặc Member: chỉ xem dự án của mình.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def filter_queryset(self, request):
        user = request.user
        if user.is_staff:
            return Project.objects.all()
        return Project.objects.filter(Q(owner=user) | Q(members=user)).distinct()


# Phân quyền ProjectDetail
class IsProjectOwnerOrMember(BasePermission):
    """
    DetailView:
    - Owner: full quyền
    - Member: chỉ xem
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in SAFE_METHODS:
            return request.user in obj.members.all() or request.user == obj.owner
        return request.user == obj.owner


# Phân quyền TaskList
class CanViewTaskList(BasePermission):
    """
    ListView: 
    - Admin: thấy tất cả,
    - Owner: hoặc Member: chỉ xem task thuộc project mình.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def filter_queryset(self, request, project_pk):
        user = request.user
        if user.is_staff:
            return Task.objects.filter(project_id=project_pk)
        return Task.objects.filter(Q(project__id=project_pk,
            project__members=user) | Q(project__id=project_pk, project__owner=user)).distinct()


# Phân quyền TaskDetail
class IsTaskPermission(BasePermission):
    """
    DetailView:
    - Chủ project: full quyền
    - Member/Assignee: xem + sửa
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff:
            return True

        project = obj.project
        is_owner = user == project.owner
        is_member = user in project.members.all()
        is_assignee = user == obj.assignee

        if request.method in SAFE_METHODS:
            return is_owner or is_member or is_assignee
        if request.method in ['PUT', 'PATCH']:
            return is_owner or is_member or is_assignee
        if request.method == 'DELETE':
            return is_owner
        return False


# Phân quyền Comment/Attachment List
class CanViewCommentOrAttachmentList(BasePermission):
    """
    ListView:
    - Admin: thấy tất cả,
    - Owner hoặc Member: chỉ xem của project mình.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


# Phân quyền Comment/Attachment Detail
class IsCommentOrAttachmentOwner(BasePermission):
    """
    DetailView:
    - Member dự án: được xem
    - Tác giả/uploader: được sửa/xóa
    - Chủ dự án: được xóa
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff:
            return True
        project = obj.task.project
        is_owner = user == project.owner
        is_member = user in project.members.all()
        author_or_uploader = getattr(obj, 'author', None) or getattr(obj, 'uploader', None)
        is_author = user == author_or_uploader
        if request.method in SAFE_METHODS:
            return is_owner or is_member
        if request.method == 'DELETE' and is_owner:
            return True
        return is_author


# Phân quyền ActivityLog View
class CanViewActivityLog(BasePermission):
    """
    Chỉ owner, member, hoặc admin được xem.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


# Phân quyền quản lý thành viên dự án
class IsProjectOwnerOnly(BasePermission):
    """
    Chỉ chủ dự án (owner) mới có quyền thêm hoặc xóa thành viên.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return request.user == obj.owner