from apps.accounts.models import UserProfile


def is_master_user(user):
    if not user or not user.is_authenticated:
        return False
    profile = getattr(user, 'profile', None)
    if profile and profile.role == UserProfile.ROLE_MASTER:
        return True
    return bool(user.is_superuser)
