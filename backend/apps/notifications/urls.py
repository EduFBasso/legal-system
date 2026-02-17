from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('test/', views.create_test_notification, name='create-test-notification'),
    path('', include(router.urls)),
]
