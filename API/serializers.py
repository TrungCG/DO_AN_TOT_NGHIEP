from rest_framework import serializers
from .models import User, Project, Task, Comment, Attachment, ActivityLog
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
    # Serializer để hiển thị thông tin User một cách an toàn.
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
    
    # CẢI TIẾN: Dùng trường riêng để nhận danh sách ID của members khi ghi (POST/PUT)
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
            'project', 'assignee', 'assignee_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['project']

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