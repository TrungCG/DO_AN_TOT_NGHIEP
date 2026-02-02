import re
from rest_framework import serializers
from .models import User, Project, Task, Comment, Attachment, ActivityLog, Notification
from rest_framework.validators import UniqueValidator

class SignupSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(
        required=True, 
        validators=[UniqueValidator(queryset=User.objects.all(), message="Email đã được sử dụng.")]
    )
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'confirm_password', 'first_name', 'last_name')
        extra_kwargs = {'username': {'required': True}}

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Mật khẩu xác nhận không khớp."})
        return data

    def create(self, validated_data): 
        validated_data.pop('confirm_password') 
        user = User.objects.create_user( 
            username=validated_data['username'], 
            email=validated_data['email'], 
            password=validated_data['password'], 
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
            ) 
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        
class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=User.objects.all(), source='members', required=False
    )

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'members', 'member_ids', 'created_at', 'updated_at']
        read_only_fields = ['owner']

class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        write_only=True, queryset=User.objects.all(), source='assignee', allow_null=True, required=False
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority', 'due_date', 
            'project', 'assignee', 'assignee_id', 
            'is_personal', 'created_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['project', 'is_personal', 'created_by']

    def validate(self, data):
        return data

    def _send_assignment_notification(self, instance, old_assignee):
        """Gửi thông báo khi assignee thay đổi."""
        from .views import create_notification
        
        new_assignee = instance.assignee
        user = self.context.get('request').user if self.context.get('request') else None
        
        # Chỉ gửi nếu assignee thay đổi và có assignee mới
        if new_assignee and new_assignee != old_assignee and user:
            project_name = instance.project.name if instance.project else "một dự án"
            create_notification(
                recipient=new_assignee,
                title="Bạn được giao một công việc mới",
                message=f"Bạn vừa được {user.username} giao công việc '{instance.title}' trong dự án '{project_name}'.",
                project=instance.project,
                task=instance
            )

    def create(self, validated_data):
        instance = super().create(validated_data)
        self._send_assignment_notification(instance, None)
        return instance

    def update(self, instance, validated_data):
        old_assignee = instance.assignee
        updated_instance = super().update(instance, validated_data)
        self._send_assignment_notification(updated_instance, old_assignee)
        return updated_instance

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'body', 'author', 'task', 'created_at', 'updated_at']
        read_only_fields = ['author', 'task']

class AttachmentSerializer(serializers.ModelSerializer):
    uploader = UserSerializer(read_only=True)

    class Meta:
        model = Attachment
        fields = ['id', 'file', 'description', 'uploader', 'task', 'uploaded_at']
        read_only_fields = ['uploader', 'task']

class ActivityLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'action_description', 'actor', 'project', 'task', 'timestamp']
        

# Set Password (cho user Google hoặc các user muốn set password)
class SetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu xác nhận không khớp."})
        return data


# Forgot Password (Bước 1: User nhập email)
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


# Reset Password (Bước 2: User set password mới với token)
class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu xác nhận không khớp."})
        return data


# Notification Serializer
class NotificationSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    task_title = serializers.CharField(source='task.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'project', 'project_name', 'task', 'task_title', 'is_read', 'created_at']
        read_only_fields = ['id', 'project_name', 'task_title', 'created_at']


# login google
class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)