from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission


User = get_user_model()


class RolePermission(BasePermission):
    allowed_roles: tuple[str, ...] = ()

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (not self.allowed_roles or request.user.role in self.allowed_roles)
        )


class IsSuperAdmin(RolePermission):
    allowed_roles = (User.Role.SUPERADMIN,)


class IsAdmin(RolePermission):
    allowed_roles = (User.Role.ADMIN, User.Role.SUPERADMIN)


class IsCoach(RolePermission):
    allowed_roles = (User.Role.COACH, User.Role.ADMIN, User.Role.SUPERADMIN)


class IsClient(RolePermission):
    allowed_roles = (
        User.Role.CLIENT,
        User.Role.COACH,
        User.Role.ADMIN,
        User.Role.SUPERADMIN,
    )
