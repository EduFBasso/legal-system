"""
Views for Cases app
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count

from .models import Case, CaseParty, CaseMovement, CasePrazo, CaseTask, Payment, Expense
from .serializers import (
    CaseListSerializer,
    CaseDetailSerializer,
    CasePartySerializer,
    CaseMovementSerializer,
    CasePrazoSerializer,
    CaseTaskSerializer,
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
        """
        Soft delete: mark as deleted instead of removing from database
        
        Query params:
        - delete_linked_publication: bool (default: False)
          * True: Also soft-delete the linked publication
          * False: Unlink publication (reset to PENDING status for reuse)
        """
        # Verificar se deve deletar também a publicação vinculada
        delete_linked_publication = self.request.data.get('delete_linked_publication', False)
        
        # Desvincular TODAS as publicações relacionadas a este case
        from apps.publications.models import Publication
        
        # Buscar todas as publicações vinculadas (não apenas publicacao_origem)
        related_pubs = Publication.objects.filter(case_id=instance.id, deleted=False)
        
        for pub in related_pubs:
            if delete_linked_publication:
                # Soft delete a publicação também
                pub.deleted = True
                pub.deleted_at = timezone.now()
                pub.save(update_fields=['deleted', 'deleted_at', 'updated_at'])
            else:
                # Apenas desvincula: reseta case e volta status para PENDING
                pub.case = None
                pub.integration_status = 'PENDING'
                pub.save(update_fields=['case', 'integration_status', 'updated_at'])
        
        # Renomear numero_processo para liberar constraint UNIQUE
        # Permite criar novo caso com mesmo número no futuro
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        instance.numero_processo = f"{instance.numero_processo}_deleted_{timestamp}"
        
        # Deletar soft o case
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


class CasePrazoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CasePrazo model (prazos processuais)
    
    Provides CRUD operations for deadlines linked to case movements.
    Each movement can have multiple deadlines (15 days, 30 days, 45 days, etc).
    """
    queryset = CasePrazo.objects.all().order_by('data_limite')
    serializer_class = CasePrazoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'movimentacao': ['exact'],
        'movimentacao__case': ['exact'],
        'data_limite': ['gte', 'lte', 'exact'],
        'completed': ['exact'],
    }
    search_fields = [
        'descricao',
        'movimentacao__titulo',
        'movimentacao__case__numero_processo',
    ]
    ordering_fields = ['data_limite', 'prazo_dias', 'created_at']
    ordering = ['data_limite']
    
    def get_queryset(self):
        """
        Optionally filter by movimentacao_id or case_id from URL parameters
        """
        queryset = super().get_queryset()
        movimentacao_id = self.request.query_params.get('movimentacao_id')
        case_id = self.request.query_params.get('case_id')
        
        if movimentacao_id:
            queryset = queryset.filter(movimentacao_id=movimentacao_id)
        elif case_id:
            queryset = queryset.filter(movimentacao__case_id=case_id)
        
        return queryset


class CaseTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tarefas vinculadas ao processo.

    Permite tarefas vinculadas a movimentações e tarefas soltas do caso.
    """
    queryset = CaseTask.objects.all().order_by('data_vencimento', '-created_at')
    serializer_class = CaseTaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'case': ['exact'],
        'movimentacao': ['exact', 'isnull'],
        'urgencia': ['exact', 'in'],
        'status': ['exact', 'in'],
        'data_vencimento': ['gte', 'lte', 'exact'],
    }
    search_fields = [
        'titulo',
        'descricao',
        'case__numero_processo',
        'movimentacao__titulo',
    ]
    ordering_fields = ['data_vencimento', 'urgencia', 'status', 'created_at']
    ordering = ['data_vencimento', '-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()

        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case_id=case_id)

        movimentacao_id = self.request.query_params.get('movimentacao_id')
        if movimentacao_id:
            queryset = queryset.filter(movimentacao_id=movimentacao_id)

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
