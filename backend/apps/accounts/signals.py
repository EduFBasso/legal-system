from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile
from apps.organizations.models import Organization


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile_for_user(sender, instance, created, **kwargs):
    if created:
        default_org, _ = Organization.objects.get_or_create(name='Escritório Principal')
        UserProfile.objects.create(user=instance, organization=default_org)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_profile_for_user(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
