from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.db.utils import OperationalError, ProgrammingError
from django.db.models.signals import post_migrate

from .models import UserProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile_for_user(sender, instance, created, raw=False, **kwargs):
    # Durante loaddata/fixtures (raw=True), não criar/alterar registros derivados.
    # Isso evita duplicar perfis quando restauramos User + UserProfile via dumpdata.
    if raw:
        return
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_profile_for_user(sender, instance, raw=False, **kwargs):
    if raw:
        return
    if hasattr(instance, 'profile'):
        instance.profile.save()


def ensure_default_master_user():
    User = get_user_model()

    try:
        has_active_master = User.objects.filter(
            is_active=True,
            profile__role=UserProfile.ROLE_MASTER,
            profile__is_active=True,
        ).exists()
    except (OperationalError, ProgrammingError):
        return None

    if has_active_master:
        return None

    username = (getattr(settings, 'DEFAULT_MASTER_USERNAME', '') or '').strip()
    email = (getattr(settings, 'DEFAULT_MASTER_EMAIL', '') or '').strip()
    password = getattr(settings, 'DEFAULT_MASTER_PASSWORD', '') or ''
    first_name = (getattr(settings, 'DEFAULT_MASTER_FIRST_NAME', '') or '').strip()

    if not username or not password:
        return None

    user = User.objects.filter(username__iexact=username).first()
    if not user and email:
        user = User.objects.filter(email__iexact=email).first()

    if user is None:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            is_active=True,
        )
    else:
        user.is_active = True
        if email:
            user.email = email
        if first_name:
            user.first_name = first_name
        user.set_password(password)
        user.save(update_fields=['is_active', 'email', 'first_name', 'password'])

    profile = getattr(user, 'profile', None)
    if not profile:
        profile = UserProfile.objects.create(user=user)

    profile.role = UserProfile.ROLE_MASTER
    profile.is_active = True
    profile.full_name_oab = profile.full_name_oab or first_name or username
    profile.save(update_fields=['role', 'is_active', 'full_name_oab', 'updated_at'])
    return user


@receiver(post_migrate)
def ensure_default_master_user_after_migrate(sender, **kwargs):
    if getattr(sender, 'name', None) != 'apps.accounts':
        return
    ensure_default_master_user()
