"""
URLs para o app de contatos.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactViewSet

# Router para registrar viewsets
router = DefaultRouter()
router.register(r'contacts', ContactViewSet, basename='contact')

# URL patterns do app
urlpatterns = [
    path('', include(router.urls)),
]
