from apps.accounts.models import UserProfile
from rest_framework.permissions import BasePermission


def is_master_user(user):
    if not user or not user.is_authenticated:
        return False
    profile = getattr(user, 'profile', None)
    if profile and profile.role == UserProfile.ROLE_MASTER:
        return True
    return bool(user.is_superuser)


class IsMasterPermission(BasePermission):
    message = 'Acesso permitido apenas para usuários MASTER.'

    def has_permission(self, request, view):
        return is_master_user(request.user)
