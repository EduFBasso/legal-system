from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

from .models import UserProfile


User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'role',
            'full_name_oab',
            'oab_number',
            'monitored_tribunais',
            'is_active',
        ]


class LoginTokenSerializer(TokenObtainPairSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'username' in self.fields:
            self.fields['username'].required = False
            self.fields['username'].allow_blank = True

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        profile = getattr(user, 'profile', None)
        token['role'] = profile.role if profile else 'ADVOGADO'
        return token

    def _resolve_user_from_identifier(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')
        password = attrs.get('password')

        if not password:
            raise AuthenticationFailed('Senha é obrigatória.')

        if email:
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                raise AuthenticationFailed('Credenciais inválidas.')

            if user.is_superuser:
                raise AuthenticationFailed('Usuário técnico não pode logar pelo sistema. Use um usuário MASTER.')

            attrs['username'] = user.username
            return attrs

        if username:
            user = User.objects.filter(username=username).first()
            if user and user.is_superuser:
                raise AuthenticationFailed('Usuário técnico não pode logar pelo sistema. Use um usuário MASTER.')
            return attrs

        raise AuthenticationFailed('Informe email ou username para entrar.')

    def validate(self, attrs):
        attrs = self._resolve_user_from_identifier(attrs)
        data = super().validate(attrs)
        profile = getattr(self.user, 'profile', None)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'is_superuser': self.user.is_superuser,
            'role': profile.role if profile else 'ADVOGADO',
            'full_name_oab': profile.full_name_oab if profile else '',
            'oab_number': profile.oab_number if profile else '',
            'monitored_tribunais': profile.monitored_tribunais if profile else [],
        }
        return data
