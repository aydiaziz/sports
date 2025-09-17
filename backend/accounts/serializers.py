from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from tenants.models import Tenant


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    tenant = serializers.PrimaryKeyRelatedField(queryset=Tenant.objects.all(), required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'tenant',
        )
        read_only_fields = ('id',)

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)


class TenantSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = (
            'id',
            'name',
            'slug',
            'logo_url',
            'theme_primary',
            'theme_secondary',
        )


class UserProfileSerializer(serializers.ModelSerializer):
    tenant = TenantSummarySerializer(read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'tenant',
        )


class MeSerializer(serializers.Serializer):
    role = serializers.CharField()
    tenant = TenantSummarySerializer(allow_null=True)
    profile = UserProfileSerializer()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['tenant'] = user.tenant_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data.update(
            {
                'role': self.user.role,
                'tenant': self.user.tenant_id,
                'email': self.user.email,
            }
        )
        return data
