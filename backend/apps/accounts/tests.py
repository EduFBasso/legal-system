from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from apps.accounts.models import UserProfile
from apps.accounts.signals import ensure_default_master_user


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