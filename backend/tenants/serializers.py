from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import OwnerInvitation, Tenant


User = get_user_model()


class TenantSerializer(serializers.ModelSerializer):
    owners_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Tenant
        fields = (
            'id',
            'name',
            'slug',
            'logo_url',
            'theme_primary',
            'theme_secondary',
            'address',
            'contact_email',
            'is_active',
            'owners_count',
        )


class TenantDetailSerializer(TenantSerializer):
    owners = serializers.SerializerMethodField()

    class Meta(TenantSerializer.Meta):
        fields = TenantSerializer.Meta.fields + ('owners',)

    def get_owners(self, obj: Tenant) -> list[dict[str, str]]:
        owners = obj.users.filter(role=User.Role.OWNER).order_by('email')
        return [
            {
                'id': owner.id,
                'email': owner.email,
                'first_name': owner.first_name,
                'last_name': owner.last_name,
            }
            for owner in owners
        ]


class OwnerInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        tenant: Tenant = self.context['tenant']
        if OwnerInvitation.objects.filter(tenant=tenant, email=value, status=OwnerInvitation.Status.PENDING).exists():
            raise serializers.ValidationError('An invitation is already pending for this email')
        return value

    def create(self, validated_data: dict) -> OwnerInvitation:
        tenant: Tenant = self.context['tenant']
        invitation = OwnerInvitation.objects.create(tenant=tenant, **validated_data)
        return invitation


class AssignOwnerSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value: int) -> int:
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('User not found') from exc
        if user.role != User.Role.OWNER:
            raise serializers.ValidationError('User must have OWNER role')
        return value

    def save(self, **kwargs) -> User:
        tenant: Tenant = self.context['tenant']
        user = User.objects.get(id=self.validated_data['user_id'])
        user.tenant = tenant
        user.role = User.Role.OWNER
        user.save()
        return user


class OwnerInvitationResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerInvitation
        fields = ('id', 'email', 'token', 'status', 'expires_at')
        read_only_fields = fields


class AcceptOwnerInviteSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    def validate(self, attrs: dict) -> dict:
        token = attrs['token']
        try:
            invitation = OwnerInvitation.objects.select_related('tenant').get(token=token)
        except OwnerInvitation.DoesNotExist as exc:
            raise serializers.ValidationError({'token': 'Invalid invitation token'}) from exc

        if invitation.status != OwnerInvitation.Status.PENDING:
            raise serializers.ValidationError({'token': 'Invitation has already been used'})
        if invitation.is_expired:
            invitation.mark_expired()
            raise serializers.ValidationError({'token': 'Invitation has expired'})

        attrs['invitation'] = invitation
        return attrs

    def create(self, validated_data: dict) -> User:
        invitation: OwnerInvitation = validated_data['invitation']
        password = validated_data['password']
        first_name = validated_data['first_name']
        last_name = validated_data['last_name']

        try:
            user = User.objects.get(email=invitation.email)
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=invitation.email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.OWNER,
                tenant=invitation.tenant,
            )
        else:
            user.tenant = invitation.tenant
            user.role = User.Role.OWNER
            user.first_name = first_name
            user.last_name = last_name
            user.set_password(password)
            user.save()

        invitation.mark_accepted()
        return user
