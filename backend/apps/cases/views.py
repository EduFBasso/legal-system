"""
Views for Cases app
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count

from .models import Case, CaseParty, CaseMovement, Payment, Expense
from .serializers import (
    CaseListSerializer,
    CaseDetailSerializer,
    CasePartySerializer,
    CaseMovementSerializer,
    PaymentSerializer,
    ExpenseSerializer,
)


class CaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Case model
    
    Provides CRUD operations plus custom actions:
    - list: Get all cases (with filters)
    - retrieve: Get single case detail
    - create: Create new case
    - update/partial_update: Update case
    - destroy: Soft delete case
    - restore: Restore deleted case
    - update_status: Auto-update status based on activity
    """
    queryset = Case.objects.filter(deleted=False).order_by('-data_ultima_movimentacao')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'tribunal': ['exact', 'in'],
        'comarca': ['exact', 'icontains'],
        'status': ['exact'],
        'auto_status': ['exact'],
        'data_distribuicao': ['gte', 'lte', 'exact'],
        'data_ultima_movimentacao': ['gte', 'lte', 'exact'],
    }
    search_fields = [
        'numero_processo',
        'numero_processo_unformatted',
        'titulo',
        'observacoes',
        'comarca',
        'vara',
        'tipo_acao',
    ]
    ordering_fields = [
        'data_distribuicao',
        'data_ultima_movimentacao',
        'data_encerramento',
        'created_at',
        'updated_at',
    ]
    ordering = ['-data_ultima_movimentacao']
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'list':
            return CaseListSerializer
        return CaseDetailSerializer
    
    def perform_destroy(self, instance):
        """Soft delete: mark as deleted instead of removing from database"""
        instance.deleted = True
        instance.deleted_at = timezone.now()
        instance.deleted_reason = self.request.data.get('deleted_reason', 'Deleted via API')
        instance.save()
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a soft-deleted case"""
        case = self.get_object()
        if not case.deleted:
            return Response(
                {'error': 'Case is not deleted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        case.deleted = False
        case.deleted_at = None
        case.deleted_reason = None
        case.save()
        
        serializer = self.get_serializer(case)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Manually trigger auto-status update based on activity"""
        case = self.get_object()
        case.atualizar_status_automatico()
        case.save()
        
        serializer = self.get_serializer(case)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics about cases"""
        queryset = self.filter_queryset(self.get_queryset())
        
        stats_data = {
            'total': queryset.count(),
            'by_status': dict(queryset.values_list('status').annotate(Count('id'))),
            'by_tribunal': dict(queryset.values_list('tribunal').annotate(Count('id'))),
            'ativos': queryset.filter(status='ATIVO').count(),
            'inativos': queryset.filter(status='INATIVO').count(),
        }
        
        return Response(stats_data)


class CasePartyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CaseParty model (relationship between Case and Contact)
    """
    queryset = CaseParty.objects.all().order_by('-created_at')
    serializer_class = CasePartySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'case': ['exact'],
        'contact': ['exact'],
        'role': ['exact'],
    }
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class CaseMovementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CaseMovement model (movimentações processuais)
    
    Provides CRUD operations for case movements.
    Automatically updates Case.data_ultima_movimentacao on create/update/delete.
    """
    queryset = CaseMovement.objects.all().order_by('-data', '-created_at')
    serializer_class = CaseMovementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'case': ['exact'],
        'tipo': ['exact', 'in'],
        'origem': ['exact', 'in'],
        'data': ['gte', 'lte', 'exact'],
        'data_limite_prazo': ['gte', 'lte', 'exact'],
    }
    search_fields = [
        'titulo',
        'descricao',
        'case__numero_processo',
    ]
    ordering_fields = ['data', 'created_at', 'data_limite_prazo']
    ordering = ['-data', '-created_at']
    
    def get_queryset(self):
        """
        Optionally filter by case_id from URL parameter
        For use in nested routes like /api/cases/{id}/movimentacoes/
        """
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payment model (Recebimentos de honorários)
    
    Provides CRUD operations for client payments.
    Automatically filters by case_id from query parameters or URL.
    """
    queryset = Payment.objects.all().order_by('-date', '-created_at')
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'case': ['exact'],
        'date': ['gte', 'lte', 'exact'],
    }
    ordering_fields = ['date', 'value', 'created_at']
    ordering = ['-date', '-created_at']
    
    def get_queryset(self):
        """
        Optionally filter by case_id from URL parameter.
        For use in nested routes like /api/cases/{id}/payments/
        """
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Expense model (Despesas/custos do processo)
    
    Provides CRUD operations for case expenses.
    Automatically filters by case_id from query parameters or URL.
    """
    queryset = Expense.objects.all().order_by('-date', '-created_at')
    serializer_class = ExpenseSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'case': ['exact'],
        'date': ['gte', 'lte', 'exact'],
    }
    ordering_fields = ['date', 'value', 'created_at']
    ordering = ['-date', '-created_at']
    
    def get_queryset(self):
        """
        Optionally filter by case_id from URL parameter.
        For use in nested routes like /api/cases/{id}/expenses/
        """
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset
