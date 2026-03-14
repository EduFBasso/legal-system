from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model

from .permissions import is_master_user
from .serializers import LoginTokenSerializer, UserProfileSerializer


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
        first_name = (user.first_name or user.username or '').strip()
        oab_number = (profile.oab_number if profile else '') or ''
        label_name = f"{first_name} {oab_number}".strip()
        display_name = (
            label_name
            or user.email
            or user.username
        )
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
