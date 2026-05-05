from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.test import TestCase, override_settings

from apps.accounts.models import UserProfile
from apps.accounts.signals import ensure_default_master_user
from apps.accounts.serializers import TeamMemberSerializer


User = get_user_model()


@override_settings(
    DEFAULT_MASTER_USERNAME='master.bootstrap',
    DEFAULT_MASTER_EMAIL='master.bootstrap@example.com',
    DEFAULT_MASTER_PASSWORD='SenhaForte!123',
    DEFAULT_MASTER_FIRST_NAME='Bootstrap',
)
class DefaultMasterBootstrapTests(TestCase):
    def setUp(self):
        User.objects.all().delete()

    def test_creates_default_master_when_none_exists(self):
        user = ensure_default_master_user()

        self.assertIsNotNone(user)
        self.assertEqual(user.username, 'master.bootstrap')
        self.assertTrue(user.check_password('SenhaForte!123'))
        self.assertEqual(user.profile.role, UserProfile.ROLE_MASTER)
        self.assertTrue(user.profile.is_active)

    def test_does_not_create_second_master_when_one_already_exists(self):
        existing = User.objects.create_user(
            username='existing.master',
            email='existing.master@example.com',
            password='SenhaExistente!123',
        )
        existing.profile.role = UserProfile.ROLE_MASTER
        existing.profile.is_active = True
        existing.profile.save(update_fields=['role', 'is_active'])

        result = ensure_default_master_user()

        self.assertIsNone(result)
        self.assertEqual(
            User.objects.filter(profile__role=UserProfile.ROLE_MASTER, profile__is_active=True).count(),
            1,
        )


class TeamMemberNameFallbackTests(TestCase):
    def setUp(self):
        self.master = User.objects.create_user(
            username='master.tests',
            email='master.tests@example.com',
            password='SenhaForte!123',
            first_name='Master',
        )
        self.master.profile.role = UserProfile.ROLE_MASTER
        self.master.profile.is_active = True
        self.master.profile.save(update_fields=['role', 'is_active'])
        self.client = APIClient()
        self.client.force_authenticate(self.master)

    def test_team_member_serializer_falls_back_to_full_name_when_first_name_empty(self):
        user = User.objects.create_user(
            username='ana.silva',
            email='ana.silva@example.com',
            password='SenhaForte!123',
            first_name='',
        )
        user.profile.role = UserProfile.ROLE_ADVOGADO
        user.profile.full_name_oab = 'Ana Silva'
        user.profile.oab_number = '123456'
        user.profile.is_active = True
        user.profile.save(update_fields=['role', 'full_name_oab', 'oab_number', 'is_active'])

        payload = TeamMemberSerializer.from_user(user)

        self.assertEqual(payload['first_name'], 'Ana')

    def test_lawyers_for_login_falls_back_to_full_name_when_first_name_empty(self):
        user = User.objects.create_user(
            username='ana.silva',
            email='ana.silva@example.com',
            password='SenhaForte!123',
            first_name='',
        )
        user.profile.role = UserProfile.ROLE_ADVOGADO
        user.profile.full_name_oab = 'Ana Silva'
        user.profile.oab_number = '123456'
        user.profile.is_active = True
        user.profile.save(update_fields=['role', 'full_name_oab', 'oab_number', 'is_active'])

        response = self.client.get('/api/auth/lawyers/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['name'], 'Ana')


class MasterSelfAccountProfileUpdateTests(TestCase):
    def setUp(self):
        self.master = User.objects.create_user(
            username='master.profile',
            email='master.profile@example.com',
            password='SenhaForte!123',
            first_name='Master',
        )
        self.master.profile.role = UserProfile.ROLE_MASTER
        self.master.profile.is_active = True
        self.master.profile.save(update_fields=['role', 'is_active'])

        self.client = APIClient()
        self.client.force_authenticate(self.master)

    def test_master_can_update_full_name_and_oab_number(self):
        response = self.client.patch(
            '/api/auth/account/',
            {
                'full_name_oab': 'Ana Silva',
                'oab_number': '123456',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['full_name_oab'], 'Ana Silva')
        self.assertEqual(response.data['oab_number'], '123456')

        self.master.refresh_from_db()
        self.master.profile.refresh_from_db()
        self.assertEqual(self.master.profile.full_name_oab, 'Ana Silva')
        self.assertEqual(self.master.profile.oab_number, '123456')