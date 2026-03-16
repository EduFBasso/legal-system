from django.db.models import Q

from apps.accounts.permissions import is_master_user


def is_truthy(value):
    return str(value).lower() in {'1', 'true', 'yes', 'on'}


def has_master_team_scope(request):
    user = getattr(request, 'user', None)
    return bool(user and user.is_authenticated and is_master_user(user) and request.query_params.get('team_scope') == 'all')


def get_master_scope_user(request, user_model):
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated or not is_master_user(user):
        return None

    if has_master_team_scope(request):
        return None

    team_member_id = request.query_params.get('team_member_id') if request else None
    if not team_member_id:
        return None

    try:
        return user_model.objects.filter(id=int(team_member_id), is_active=True).first()
    except (TypeError, ValueError):
        return None


def get_active_team_members_queryset(user_model):
    return user_model.objects.filter(
        is_superuser=False,
        is_active=True,
        profile__isnull=False,
        profile__is_active=True,
    ).exclude(profile__role='MASTER')


def build_owner_scope_q(owner, owner_field='owner', include_ownerless=False):
    query = Q(**{owner_field: owner})
    if include_ownerless:
        query |= Q(**{f'{owner_field}__isnull': True})
    return query


def apply_user_owned_only(queryset, user, owner_field='owner'):
    return queryset.filter(build_owner_scope_q(user, owner_field=owner_field, include_ownerless=False))


def apply_user_owned_or_shared(queryset, user, owner_field='owner'):
    return queryset.filter(build_owner_scope_q(user, owner_field=owner_field, include_ownerless=True))


def apply_master_team_scope(queryset, request, user_model, owner_field='owner', include_ownerless=True):
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated or not is_master_user(user):
        return queryset

    owner_filter = Q(**{f'{owner_field}__in': get_active_team_members_queryset(user_model)})

    if not is_truthy(request.query_params.get('exclude_owner_self')):
        owner_filter |= Q(**{owner_field: user})

    if include_ownerless and not is_truthy(request.query_params.get('exclude_ownerless')):
        owner_filter |= Q(**{f'{owner_field}__isnull': True})

    return queryset.filter(owner_filter)