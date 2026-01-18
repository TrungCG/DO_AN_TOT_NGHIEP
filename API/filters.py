import django_filters
from django.db.models import Q
from .models import Task, Project, User


# Filter cho Task
class TaskFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    priority = django_filters.CharFilter(field_name='priority', lookup_expr='iexact')
    assignee = django_filters.CharFilter(method='filter_assignee')
    search = django_filters.CharFilter(method='filter_search')
    due_date_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    due_date_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')

    class Meta:
        model = Task
        fields = ['status', 'priority', 'assignee', 'due_date_after', 'due_date_before']
    
    # Lọc assignee: 'me' cho user hiện tại hoặc theo ID user
    def filter_assignee(self, queryset, name, value):
        user = self.request.user
        if value.lower() == 'me':
            return queryset.filter(assignee=user)
        elif value.isdigit():
            return queryset.filter(assignee__id=int(value))
        return queryset

    # Lọc tìm kiếm theo tiêu đề công việc
    def filter_search(self, queryset, name, value):
        return queryset.filter(title__icontains=value)



class ProjectFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    role = django_filters.CharFilter(method='filter_role')
    
    class Meta:
        model = Project
        fields = ['search', 'role']

    # Lọc tìm kiếm theo tên dự án
    def filter_search(self, queryset, name, value):
        return queryset.filter(name__icontains=value)

    # Lọc theo vai trò: 'owner' hoặc 'member'
    def filter_role(self, queryset, name, value):
        user = self.request.user
        value = value.lower()
        if value == 'owner':
            return queryset.filter(owner=user)
        elif value == 'member':
            return queryset.filter(members=user)
        return queryset



class UserFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = User
        fields = ['search']

    # Lọc tìm kiếm theo username hoặc email
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(username__icontains=value) | Q(email__icontains=value)
        )
