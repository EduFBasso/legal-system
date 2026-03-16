from typing import Optional

from apps.organizations.models import Organization


def get_user_organization(user) -> Optional[Organization]:
    if not user or not user.is_authenticated:
        return None

    from apps.accounts.models import UserProfile

    profile = getattr(user, 'profile', None)
    if profile is None:
        default_org, _ = Organization.objects.get_or_create(name='Escritório Principal')
        profile = UserProfile.objects.create(user=user, organization=default_org)

    if getattr(profile, 'organization_id', None) is None:
        default_org, _ = Organization.objects.get_or_create(name='Escritório Principal')
        profile.organization = default_org
        profile.save(update_fields=['organization', 'updated_at'])

    if profile is None:
        return None

    return getattr(profile, 'organization', None)


def filter_by_user_organization(queryset, user, field_name='organization'):
    organization = get_user_organization(user)
    if organization is None:
        return queryset.none()

    return queryset.filter(**{field_name: organization})
