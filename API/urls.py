from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # path('', views.task_page, name='frontend'),
    
    # Xác thực người dùng (Authentication)
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('login/', views.LoginView.as_view(), name='login'), # Đăng nhập JWT         
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # Làm mới token

    # Người dùng (Users)
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # Dự án (Projects)
    path('projects/', views.ProjectListView.as_view(), name='project-list'),
    path('projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),

    # Quản lý thành viên dự án
    path('projects/<int:pk>/add_member/', views.AddMemberView.as_view(), name='project-add-member'),
    path('projects/<int:pk>/remove_member/', views.RemoveMemberView.as_view(), name='project-remove-member'),

    # Công việc (Tasks)
    path('projects/<int:pk>/tasks/', views.TaskListView.as_view(), name='task-list'),
    path('projects/<int:project_pk>/tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),

    # Bình luận (Comments)
    path('projects/<int:project_pk>/tasks/<int:task_pk>/comments/', views.CommentListView.as_view(), name='comment-list'),
    path('projects/<int:project_pk>/tasks/<int:task_pk>/comments/<int:pk>/', views.CommentDetailView.as_view(), name='comment-detail'),

    # Tệp đính kèm (Attachments)
    path('projects/<int:project_pk>/tasks/<int:task_pk>/attachments/', views.AttachmentListView.as_view(), name='attachment-list'),
    path('projects/<int:project_pk>/tasks/<int:task_pk>/attachments/<int:pk>/', views.AttachmentDetailView.as_view(), name='attachment-detail'),

    # Nhật ký hoạt động (Activity Log)
    path('projects/<int:project_pk>/activity/', views.ActivityLogProjectView.as_view(), name='activity-project'),
    path('projects/<int:project_pk>/tasks/<int:task_pk>/activity/', views.ActivityLogTaskView.as_view(), name='activity-task'),
]
