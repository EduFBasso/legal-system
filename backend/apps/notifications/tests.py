from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.notifications.models import Notification


User = get_user_model()


class NotificationScopeAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='user1', password='testpass123')
        self.other_user = User.objects.create_user(username='user2', password='testpass123')
        self.client.force_authenticate(user=self.user)

        self.own_unread = Notification.objects.create(
            owner=self.user,
            type='publication',
            title='Minha notificação',
            message='Mensagem 1',
            read=False,
        )
        self.ownerless_unread = Notification.objects.create(
            owner=None,
            type='publication',
            title='Ownerless',
            message='Mensagem 2',
            read=False,
        )
        self.other_user_unread = Notification.objects.create(
            owner=self.other_user,
            type='deadline',
            title='Outro usuário',
            message='Mensagem 3',
            read=False,
        )

    def test_unread_action_is_scoped(self):
        response = self.client.get('/api/notifications/unread/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        returned_ids = {item['id'] for item in response.data['notifications']}
        self.assertEqual(returned_ids, {self.own_unread.id, self.ownerless_unread.id})

    def test_stats_action_is_scoped(self):
        response = self.client.get('/api/notifications/stats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['unread'], 2)
        self.assertEqual(response.data['by_type']['publication'], 2)
        self.assertNotIn('deadline', response.data['by_type'])

    def test_delete_all_is_scoped(self):
        response = self.client.post('/api/notifications/delete_all/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Notification.objects.filter(id=self.own_unread.id).exists())
        self.assertFalse(Notification.objects.filter(id=self.ownerless_unread.id).exists())
        self.assertTrue(Notification.objects.filter(id=self.other_user_unread.id).exists())


class NotificationMasterScopeAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.master = User.objects.create_user(username='notif_master', password='testpass123')
        self.master.profile.role = 'MASTER'
        self.master.profile.save()

        self.user_a = User.objects.create_user(username='notif_user_a', password='testpass123')
        self.user_a.profile.role = 'ADVOGADO'
        self.user_a.profile.save()

        self.client.force_authenticate(user=self.master)

        self.master_unread = Notification.objects.create(
            owner=self.master,
            type='publication',
            title='Master notif',
            message='Mensagem',
            read=False,
        )
        self.ownerless_unread = Notification.objects.create(
            owner=None,
            type='publication',
            title='Ownerless notif',
            message='Mensagem',
            read=False,
        )
        self.user_a_unread = Notification.objects.create(
            owner=self.user_a,
            type='deadline',
            title='User A notif',
            message='Mensagem',
            read=False,
        )

    def test_master_without_scope_sees_only_own_and_ownerless(self):
        response = self.client.get('/api/notifications/unread/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data['notifications']}
        self.assertIn(self.master_unread.id, returned_ids)
        self.assertIn(self.ownerless_unread.id, returned_ids)
        self.assertNotIn(self.user_a_unread.id, returned_ids)

    def test_master_team_scope_all_sees_team(self):
        response = self.client.get('/api/notifications/unread/?team_scope=all')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data['notifications']}
        self.assertIn(self.user_a_unread.id, returned_ids)

    def test_master_team_member_id_scopes_to_member(self):
        response = self.client.get(f'/api/notifications/unread/?team_member_id={self.user_a.id}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data['notifications']}
        self.assertIn(self.user_a_unread.id, returned_ids)
        self.assertNotIn(self.master_unread.id, returned_ids)