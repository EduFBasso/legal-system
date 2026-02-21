"""
URL configuration for Cases app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, CasePartyViewSet

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'case-parties', CasePartyViewSet, basename='caseparty')

urlpatterns = [
    path('', include(router.urls)),
]
