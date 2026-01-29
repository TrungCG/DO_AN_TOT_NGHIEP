from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Xác thực
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Users
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # Projects
    path('projects/', views.ProjectListView.as_view(), name='project-list'),
    path('projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/add_member/', views.AddMemberView.as_view(), name='project-add-member'),
    path('projects/<int:pk>/remove_member/', views.RemoveMemberView.as_view(), name='project-remove-member'),

    # --- CẬP NHẬT URLS TASK ---
    
    # 1. Task Dự án (Giữ nguyên)
    path('projects/<int:pk>/tasks/', views.TaskListView.as_view(), name='project-task-list'),
    
    # 2. Task Cá nhân (MỚI)
    path('my-tasks/', views.PersonalTaskListView.as_view(), name='personal-task-list'),

    # 3. Task Detail (Dùng chung cho cả 2 loại, bỏ project_pk ở url)
    path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    # --------------------------

    # Comments
    path('projects/<int:project_pk>/tasks/<int:task_pk>/comments/', views.CommentListView.as_view(), name='comment-list'),
    path('projects/<int:project_pk>/tasks/<int:task_pk>/comments/<int:pk>/', views.CommentDetailView.as_view(), name='comment-detail'),

    # Attachments
    path('projects/<int:project_pk>/tasks/<int:task_pk>/attachments/', views.AttachmentListView.as_view(), name='attachment-list'),
    path('projects/<int:project_pk>/tasks/<int:task_pk>/attachments/<int:pk>/', views.AttachmentDetailView.as_view(), name='attachment-detail'),

    # Activity Log
    path('projects/<int:project_pk>/activity/', views.ActivityLogProjectView.as_view(), name='activity-project'),
    path('projects/<int:project_pk>/tasks/<int:task_pk>/activity/', views.ActivityLogTaskView.as_view(), name='activity-task'),

    # Google Login
    path('google-login/', views.GoogleLoginView.as_view(), name='google-login'),
]