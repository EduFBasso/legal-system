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