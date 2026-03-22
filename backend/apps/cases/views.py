"""
Views for Cases app
"""
import unicodedata
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Prefetch
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.accounts.permissions import is_master_user
from apps.accounts.scope import (
    apply_master_team_scope,
    apply_user_owned_only,
    apply_user_owned_or_shared,
    get_master_scope_user,
    is_truthy,
)


def _normalize(text):
    """Remove acentos e diacríticos e converte para minúsculas.
    Permite buscar 'jose' e encontrar 'José', 'JOSE', etc.
    """
    if not text:
        return ''
    nfd = unicodedata.normalize('NFD', str(text))
    return ''.join(c for c in nfd if unicodedata.category(c) != 'Mn').lower()

from .models import Case, CaseParty, CaseMovement, CasePrazo, CaseTask, Payment, Expense, CaseDocument
from apps.publications.models import Publication
from .serializers import (
    CaseListSerializer,
    CaseDetailSerializer,
    CasePartySerializer,
    CaseMovementSerializer,
    CasePrazoSerializer,
    CaseTaskSerializer,
    PaymentSerializer,
    ExpenseSerializer,
    CaseDocumentSerializer,
)

UserModel = get_user_model()


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

    def get_queryset(self):
        qs = Case.objects.filter(deleted=False).order_by('-data_ultima_movimentacao')
        user = self.request.user
        scope_user = get_master_scope_user(self.request, UserModel)
        if scope_user is not None:
            qs = qs.filter(owner=scope_user)
        elif user.is_authenticated and is_master_user(user):
            team_scope = self.request.query_params.get('team_scope')
            if team_scope == 'all':
                qs = apply_master_team_scope(qs, self.request, UserModel)
            else:
                # Master sem escopo explícito: exibe apenas os próprios registros (e ownerless quando aplicável).
                qs = apply_user_owned_or_shared(qs, user)
        elif user.is_authenticated and not is_master_user(user):
            qs = apply_user_owned_or_shared(qs, user)

        if self.action == 'list':
            qs = qs.prefetch_related(
                Prefetch('parties', queryset=CaseParty.objects.select_related('contact'))
            ).annotate(
                active_tasks_count=Count(
                    'tasks',
                    filter=~Q(tasks__status='CONCLUIDA'),
                    distinct=True
                )
            )
        return qs

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'tribunal': ['exact', 'in'],
        'comarca': ['exact', 'icontains'],
        'status': ['exact'],
        'auto_status': ['exact'],
        'cliente_principal': ['exact'],
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
        # parties__contact__name é tratado via _normalize em filter_queryset
        # para suportar busca sem acento no SQLite
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

    def filter_queryset(self, queryset):
        """
        Override para aplicar busca normalizada (sem acento) nos nomes das partes.
        SQLite não suporta icontains com unicode/acentos via LIKE, então
        buscamos os IDs dos contatos em Python e os adicionamos ao Q filter.
        """
        # Aplica DjangoFilterBackend e OrderingFilter; pula SearchFilter (tratado abaixo)
        for backend in self.filter_backends:
            if backend is filters.SearchFilter:
                continue
            queryset = backend().filter_queryset(self.request, queryset, self)

        search = self.request.query_params.get('search', '').strip()
        if not search:
            return queryset

        normalized = _normalize(search)

        # Busca nos campos do próprio processo (icontains padrão)
        q = (
            Q(numero_processo__icontains=search)
            | Q(numero_processo_unformatted__icontains=search)
            | Q(titulo__icontains=search)
            | Q(observacoes__icontains=search)
            | Q(comarca__icontains=search)
            | Q(vara__icontains=search)
            | Q(tipo_acao__icontains=search)
        )

        # Busca normalizada (sem acento) nos nomes das partes
        from apps.contacts.models import Contact
        contact_queryset = Contact.objects.all()
        if self.request.user.is_authenticated and not is_master_user(self.request.user):
            contact_queryset = apply_user_owned_or_shared(contact_queryset, self.request.user)

        matching_ids = [
            cid
            for cid, name in contact_queryset.values_list('id', 'name')
            if name and normalized in _normalize(name)
        ]
        if matching_ids:
            q |= Q(parties__contact__id__in=matching_ids)

        return queryset.filter(q).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated:
            serializer.save(owner=user)
        else:
            serializer.save()

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
        from apps.notifications.models import Notification
        
        # Buscar todas as publicações vinculadas (não apenas publicacao_origem)
        related_pubs = Publication.objects.filter(case_id=instance.id)
        
        for pub in related_pubs:
            if delete_linked_publication:
                # HARD DELETE a publicação também e suas notificações
                Notification.objects.filter(
                    type='publication',
                    metadata__id_api=pub.id_api,
                    read=False
                ).delete()
                pub.delete()
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

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset
        scope_user = get_master_scope_user(self.request, UserModel)
        if scope_user is not None:
            return queryset.filter(case__owner=scope_user)
        if is_master_user(user):
            team_scope = self.request.query_params.get('team_scope')
            if team_scope == 'all':
                return apply_master_team_scope(queryset, self.request, UserModel, owner_field='case__owner')
            return apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
        return apply_user_owned_or_shared(queryset, user, owner_field='case__owner')


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
        user = self.request.user
        scope_user = get_master_scope_user(self.request, UserModel)
        if scope_user is not None:
            queryset = queryset.filter(case__owner=scope_user)
        elif user.is_authenticated:
            if is_master_user(user):
                team_scope = self.request.query_params.get('team_scope')
                if team_scope == 'all':
                    queryset = apply_master_team_scope(queryset, self.request, UserModel, owner_field='case__owner')
                else:
                    queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
            else:
                queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @transaction.atomic
    def perform_destroy(self, instance):
        """
        Ao excluir uma movimentação gerada por publicação (DJE),
        reverte a publicação para estado pendente e remove vínculo com caso,
        para permitir novo fluxo manual de integração.
        """
        publication_id_api = instance.publicacao_id
        case_id = instance.case_id

        super().perform_destroy(instance)

        # Recalcular data_ultima_movimentacao após exclusão
        if case_id:
            try:
                case = Case.objects.get(id=case_id)
                case.atualizar_data_ultima_movimentacao()
            except Case.DoesNotExist:
                pass

        if not publication_id_api or not case_id:
            return

        still_linked_movements = CaseMovement.objects.filter(
            case_id=case_id,
            publicacao_id=publication_id_api,
        ).exists()
        if still_linked_movements:
            return

        Publication.objects.filter(
            id_api=publication_id_api,
            case_id=case_id,
        ).update(
            case=None,
            integration_status='PENDING',
            integration_notes='Desvinculada após exclusão manual da movimentação de origem',
            updated_at=timezone.now(),
        )


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
        user = self.request.user
        scope_user = get_master_scope_user(self.request, UserModel)
        if scope_user is not None:
            queryset = queryset.filter(movimentacao__case__owner=scope_user)
        elif user.is_authenticated:
            if is_master_user(user):
                team_scope = self.request.query_params.get('team_scope')
                if team_scope == 'all':
                    queryset = apply_master_team_scope(queryset, self.request, UserModel, owner_field='movimentacao__case__owner')
                else:
                    queryset = apply_user_owned_or_shared(queryset, user, owner_field='movimentacao__case__owner')
            else:
                queryset = apply_user_owned_or_shared(queryset, user, owner_field='movimentacao__case__owner')
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
        user = self.request.user
        scope_user = get_master_scope_user(self.request, UserModel)
        if scope_user is not None:
            queryset = queryset.filter(case__owner=scope_user)
        elif user.is_authenticated:
            if is_master_user(user):
                team_scope = self.request.query_params.get('team_scope')
                if team_scope == 'all':
                    queryset = apply_master_team_scope(queryset, self.request, UserModel, owner_field='case__owner')
                else:
                    # Master sem escopo definido: exibe apenas as próprias tarefas
                    queryset = queryset.filter(case__owner=user)
            else:
                exclude_ownerless = is_truthy(self.request.query_params.get('exclude_ownerless'))
                if exclude_ownerless:
                    queryset = apply_user_owned_only(queryset, user, owner_field='case__owner')
                else:
                    queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')

        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case_id=case_id)

        movimentacao_id = self.request.query_params.get('movimentacao_id')
        if movimentacao_id:
            queryset = queryset.filter(movimentacao_id=movimentacao_id)

        return queryset

    @action(detail=False, methods=['get'], url_path='count')
    def count(self, request):
        """Retorna apenas a contagem de tarefas para o mesmo escopo/filtros do list()."""
        queryset = self.filter_queryset(self.get_queryset())
        return Response({'count': queryset.count()})


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
        user = self.request.user
        scope_user = get_master_scope_user(self.request, UserModel)
        if scope_user is not None:
            queryset = queryset.filter(case__owner=scope_user)
        elif user.is_authenticated:
            if is_master_user(user):
                team_scope = self.request.query_params.get('team_scope')
                if team_scope == 'all':
                    queryset = apply_master_team_scope(queryset, self.request, UserModel, owner_field='case__owner', include_ownerless=False)
                else:
                    queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
            else:
                queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
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
        user = self.request.user
        scope_user = get_master_scope_user(self.request, UserModel)
        if scope_user is not None:
            queryset = queryset.filter(case__owner=scope_user)
        elif user.is_authenticated:
            if is_master_user(user):
                team_scope = self.request.query_params.get('team_scope')
                if team_scope == 'all':
                    queryset = apply_master_team_scope(queryset, self.request, UserModel, owner_field='case__owner', include_ownerless=False)
                else:
                    queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
            else:
                queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset


class CaseDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para documentos anexados ao processo.
    """

    queryset = CaseDocument.objects.select_related('case').all().order_by('-uploaded_at')
    serializer_class = CaseDocumentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'case': ['exact'],
        'file_extension': ['exact', 'in'],
        'uploaded_at': ['gte', 'lte', 'exact'],
    }
    search_fields = ['original_name', 'tipo_documento', 'description', 'case__numero_processo']
    ordering_fields = ['uploaded_at', 'original_name', 'file_size']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        scope_user = get_master_scope_user(self.request, UserModel)
        if scope_user is not None:
            queryset = queryset.filter(case__owner=scope_user)
        elif user.is_authenticated:
            if is_master_user(user):
                team_scope = self.request.query_params.get('team_scope')
                if team_scope == 'all':
                    queryset = apply_master_team_scope(queryset, self.request, UserModel, owner_field='case__owner', include_ownerless=False)
                else:
                    queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
            else:
                queryset = apply_user_owned_or_shared(queryset, user, owner_field='case__owner')
        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset
