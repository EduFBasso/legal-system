from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

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
            'publication_auto_integration',
            'is_active',
        ]


class UserPreferencesSerializer(serializers.Serializer):
    publication_auto_integration = serializers.BooleanField(required=False)

    def update(self, user, validated_data):
        profile = getattr(user, 'profile', None)
        if not profile:
            profile = UserProfile.objects.create(user=user)

        if 'publication_auto_integration' in validated_data:
            profile.publication_auto_integration = validated_data['publication_auto_integration']

        profile.save(update_fields=['publication_auto_integration', 'updated_at'])
        return profile


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
            'publication_auto_integration': profile.publication_auto_integration if profile else False,
        }
        return data


class TeamMemberSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    first_name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
    is_active = serializers.BooleanField()
    role = serializers.CharField()
    full_name_oab = serializers.CharField(allow_blank=True)
    oab_number = serializers.CharField(allow_blank=True)
    monitored_tribunais = serializers.ListField(child=serializers.CharField(), required=False)
    profile_is_active = serializers.BooleanField()

    @classmethod
    def from_user(cls, user):
        profile = getattr(user, 'profile', None)
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_active': user.is_active,
            'role': profile.role if profile else UserProfile.ROLE_ADVOGADO,
            'full_name_oab': profile.full_name_oab if profile else '',
            'oab_number': profile.oab_number if profile else '',
            'monitored_tribunais': profile.monitored_tribunais if profile else [],
            'profile_is_active': profile.is_active if profile else False,
        }


class TeamMemberCreateSerializer(serializers.Serializer):
    ROLE_CHOICES = [
        UserProfile.ROLE_ADVOGADO,
        UserProfile.ROLE_ESTAGIARIO,
    ]

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=10)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=ROLE_CHOICES, default=UserProfile.ROLE_ADVOGADO)
    full_name_oab = serializers.CharField(max_length=200, required=False, allow_blank=True)
    oab_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    monitored_tribunais = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Username já existe.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email já existe.')
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role', UserProfile.ROLE_ADVOGADO)
        full_name_oab = validated_data.pop('full_name_oab', '')
        oab_number = validated_data.pop('oab_number', '')
        monitored_tribunais = validated_data.pop('monitored_tribunais', [])

        user = User.objects.create_user(
            username=validated_data.get('username'),
            email=validated_data.get('email'),
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True,
        )

        profile = getattr(user, 'profile', None)
        if not profile:
            profile = UserProfile.objects.create(user=user)

        profile.role = role
        profile.full_name_oab = full_name_oab
        profile.oab_number = oab_number
        profile.monitored_tribunais = monitored_tribunais
        profile.is_active = True
        profile.save()
        return user


class TeamMemberUpdateSerializer(serializers.Serializer):
    ROLE_CHOICES = [
        UserProfile.ROLE_ADVOGADO,
        UserProfile.ROLE_ESTAGIARIO,
    ]

    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=ROLE_CHOICES, required=False)
    full_name_oab = serializers.CharField(max_length=200, required=False, allow_blank=True)
    oab_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    monitored_tribunais = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )

    def validate_email(self, value):
        user = self.context['user']
        exists = User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists()
        if exists:
            raise serializers.ValidationError('Email já está em uso por outro usuário.')
        return value

    def update(self, user, validated_data):
        profile = getattr(user, 'profile', None)
        if not profile:
            profile = UserProfile.objects.create(user=user)

        if 'email' in validated_data:
            user.email = validated_data['email']
        if 'first_name' in validated_data:
            user.first_name = validated_data['first_name']
        if 'last_name' in validated_data:
            user.last_name = validated_data['last_name']
        user.save()

        if 'role' in validated_data:
            profile.role = validated_data['role']
        if 'full_name_oab' in validated_data:
            profile.full_name_oab = validated_data['full_name_oab']
        if 'oab_number' in validated_data:
            profile.oab_number = validated_data['oab_number']
        if 'monitored_tribunais' in validated_data:
            profile.monitored_tribunais = validated_data['monitored_tribunais']
        profile.save()

        return user
