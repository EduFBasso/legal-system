"""
URL configuration for Cases app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CaseViewSet,
    CasePartyViewSet,
    CaseMovementViewSet,
    PaymentViewSet,
    ExpenseViewSet,
)

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'case-parties', CasePartyViewSet, basename='caseparty')
router.register(r'case-movements', CaseMovementViewSet, basename='casemovement')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]
