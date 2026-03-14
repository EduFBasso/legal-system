from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserProfile


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
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        profile = getattr(user, 'profile', None)
        token['role'] = profile.role if profile else 'ADVOGADO'
        return token

    def validate(self, attrs):
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
