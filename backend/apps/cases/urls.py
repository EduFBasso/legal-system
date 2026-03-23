"""
URL configuration for Cases app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CaseViewSet,
    CasePartyViewSet,
    CaseLinkViewSet,
    CaseMovementViewSet,
    CasePrazoViewSet,
    CaseTaskViewSet,
    PaymentViewSet,
    ExpenseViewSet,
    CaseDocumentViewSet,
)

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'case-parties', CasePartyViewSet, basename='caseparty')
router.register(r'case-links', CaseLinkViewSet, basename='caselink')
router.register(r'case-movements', CaseMovementViewSet, basename='casemovement')
router.register(r'case-prazos', CasePrazoViewSet, basename='caseprazo')
router.register(r'case-tasks', CaseTaskViewSet, basename='casetask')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'case-documents', CaseDocumentViewSet, basename='casedocument')

urlpatterns = [
    path('', include(router.urls)),
]
