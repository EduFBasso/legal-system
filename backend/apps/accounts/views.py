from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .permissions import IsMasterPermission, is_master_user
from .serializers import (
    LoginTokenSerializer,
    MasterSelfUpdateSerializer,
    TeamMemberCreateSerializer,
    TeamMemberSerializer,
    TeamMemberUpdateSerializer,
    UserPreferencesSerializer,
    UserProfileSerializer,
)


User = get_user_model()


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginTokenSerializer


class RefreshTokenView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_superuser': user.is_superuser,
        'is_master': is_master_user(user),
        'profile': UserProfileSerializer(profile).data if profile else None,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def user_preferences(request):
    profile = getattr(request.user, 'profile', None)

    if request.method == 'GET':
        return Response({
            'publication_auto_integration': profile.publication_auto_integration if profile else False,
        })

    serializer = UserPreferencesSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    updated_profile = serializer.update(request.user, serializer.validated_data)
    return Response({
        'publication_auto_integration': updated_profile.publication_auto_integration,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated, IsMasterPermission])
def master_self_account(request):
    user = request.user

    if request.method == 'GET':
        return Response({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'email': user.email,
            'role': getattr(getattr(user, 'profile', None), 'role', None),
        })

    serializer = MasterSelfUpdateSerializer(
        data=request.data,
        partial=True,
        context={'user': user},
    )
    serializer.is_valid(raise_exception=True)
    updated_user = serializer.update(user, serializer.validated_data)

    return Response({
        'id': updated_user.id,
        'username': updated_user.username,
        'first_name': updated_user.first_name,
        'email': updated_user.email,
        'role': getattr(getattr(updated_user, 'profile', None), 'role', None),
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def lawyers_for_login(request):
    users = (
        User.objects
        .select_related('profile')
        .filter(is_active=True)
        .filter(is_superuser=False)
        .filter(profile__is_active=True)
        .order_by('first_name', 'last_name', 'email', 'username')
    )

    results = []
    for user in users:
        profile = getattr(user, 'profile', None)
        profile_full_name = (profile.full_name_oab if profile else '') or ''
        profile_first_name = profile_full_name.strip().split(' ')[0] if profile_full_name.strip() else ''
        first_name = (user.first_name or profile_first_name or '').strip()
        display_name = first_name or user.username or user.email or f"Membro {user.id}"
        login_email = user.email or ''

        if not login_email:
            continue

        results.append({
            'id': user.id,
            'name': display_name,
            'email': login_email,
            'role': profile.role if profile else 'ADVOGADO',
        })

    return Response({'results': results})


def _team_queryset(include_inactive=False, role=None):
    queryset = (
        User.objects
        .select_related('profile')
        .filter(is_superuser=False)
        .filter(profile__isnull=False)
        .order_by('first_name', 'last_name', 'email', 'username')
    )

    if not include_inactive:
        queryset = queryset.filter(is_active=True, profile__is_active=True)

    if role in ('MASTER', 'ADVOGADO', 'ESTAGIARIO'):
        queryset = queryset.filter(profile__role=role)

    return queryset


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated, IsMasterPermission])
def team_members(request):
    if request.method == 'GET':
        include_inactive = request.query_params.get('include_inactive', 'false').lower() in ('1', 'true', 'yes')
        role = request.query_params.get('role')

        users = _team_queryset(include_inactive=include_inactive, role=role)
        results = [TeamMemberSerializer.from_user(user) for user in users]
        serializer = TeamMemberSerializer(results, many=True)
        return Response({'results': serializer.data})

    serializer = TeamMemberCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    output = TeamMemberSerializer(TeamMemberSerializer.from_user(user))
    return Response(output.data, status=201)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated, IsMasterPermission])
def team_member_update(request, user_id):
    user = get_object_or_404(
        User.objects.select_related('profile').filter(is_superuser=False),
        pk=user_id,
    )

    serializer = TeamMemberUpdateSerializer(
        data=request.data,
        partial=True,
        context={'user': user},
    )
    serializer.is_valid(raise_exception=True)
    updated_user = serializer.update(user, serializer.validated_data)
    output = TeamMemberSerializer(TeamMemberSerializer.from_user(updated_user))
    return Response(output.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsMasterPermission])
def team_member_deactivate(request, user_id):
    user = get_object_or_404(
        User.objects.select_related('profile').filter(is_superuser=False),
        pk=user_id,
    )

    if request.user.pk == user.pk:
        return Response({'detail': 'Você não pode desativar o próprio usuário MASTER em uso.'}, status=400)

    user.is_active = False
    user.save(update_fields=['is_active'])

    profile = getattr(user, 'profile', None)
    if profile:
        profile.is_active = False
        profile.save(update_fields=['is_active'])

    output = TeamMemberSerializer(TeamMemberSerializer.from_user(user))
    return Response(output.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsMasterPermission])
def team_member_reactivate(request, user_id):
    user = get_object_or_404(
        User.objects.select_related('profile').filter(is_superuser=False),
        pk=user_id,
    )

    user.is_active = True
    user.save(update_fields=['is_active'])

    profile = getattr(user, 'profile', None)
    if profile:
        profile.is_active = True
        profile.save(update_fields=['is_active'])

    output = TeamMemberSerializer(TeamMemberSerializer.from_user(user))
    return Response(output.data)
