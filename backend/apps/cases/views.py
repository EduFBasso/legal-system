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
from django.db import IntegrityError, transaction
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


def _collapse_spaces(text: str) -> str:
    return ' '.join(str(text or '').split())


def _capitalize_words(text: str) -> str:
    raw = _collapse_spaces(text).strip()
    if not raw:
        return ''
    return ' '.join(word[:1].upper() + word[1:].lower() for word in raw.split(' ') if word)

from .models import (
    Case,
    CaseParty,
    CaseMovement,
    CasePrazo,
    CaseTask,
    Payment,
    Expense,
    CaseDocument,
    CaseTipoAcaoOption,
    CaseTituloOption,
)
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

    @action(detail=False, methods=['get', 'post'], url_path='tipo-acao-options')
    def tipo_acao_options(self, request):
        """Lista e cadastra opções compartilhadas para `tipo_acao`.

        - GET: retorna opções padrão (choices) + opções persistidas
        - POST: cria (ou retorna existente) com normalização/descrição capitalizada
        """

        field = Case._meta.get_field('tipo_acao')
        default_options = [
            {'value': code, 'label': label, 'editable': False}
            for code, label in (field.choices or [])
            if code not in (None, '') and label
        ]

        if request.method.upper() == 'GET':
            persisted = [
                {'id': opt.id, 'value': opt.label, 'label': opt.label, 'editable': True}
                for opt in CaseTipoAcaoOption.objects.filter(is_active=True).order_by('label')
            ]

            # Dedup por label normalizada; defaults têm prioridade.
            seen = set()
            merged = []
            for opt in default_options + persisted:
                key = _collapse_spaces(_normalize(opt.get('label')))
                if not key or key in seen:
                    continue
                seen.add(key)
                merged.append(opt)

            return Response(merged)

        raw_label = request.data.get('label') or request.data.get('value') or ''
        label = _capitalize_words(raw_label)
        if not label:
            return Response({'error': 'label é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        key = _collapse_spaces(_normalize(label))

        # Se bater com uma opção padrão, não persiste: retorna a default.
        for opt in default_options:
            if _collapse_spaces(_normalize(opt['label'])) == key:
                return Response(opt, status=status.HTTP_200_OK)

        existing = CaseTipoAcaoOption.objects.filter(key=key).first()
        if existing:
            return Response({'id': existing.id, 'value': existing.label, 'label': existing.label, 'editable': True}, status=status.HTTP_200_OK)

        try:
            created = CaseTipoAcaoOption.objects.create(
                label=label,
                key=key,
                created_by=request.user if getattr(request.user, 'is_authenticated', False) else None,
            )
        except IntegrityError:
            created = CaseTipoAcaoOption.objects.filter(key=key).first()

        if not created:
            return Response({'error': 'Falha ao criar opção'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'id': created.id, 'value': created.label, 'label': created.label, 'editable': True}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['patch'], url_path='tipo-acao-options/(?P<option_id>\\d+)')
    def update_tipo_acao_option(self, request, option_id=None):
        """Edita (rename) uma opção persistida de `tipo_acao`.

        Regra: só opções persistidas são editáveis (não mexe nas hardcoded/choices).
        Também aplica capitalização e dedup por label normalizada.
        """
        try:
            option_id_int = int(option_id)
        except (TypeError, ValueError):
            return Response({'error': 'ID inválido'}, status=status.HTTP_400_BAD_REQUEST)

        opt = CaseTipoAcaoOption.objects.filter(id=option_id_int, is_active=True).first()
        if not opt:
            return Response({'error': 'Opção não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        raw_label = request.data.get('label') or request.data.get('value') or ''
        new_label = _capitalize_words(raw_label)
        if not new_label:
            return Response({'error': 'label é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        field = Case._meta.get_field('tipo_acao')
        default_labels_normalized = {
            _collapse_spaces(_normalize(label))
            for code, label in (field.choices or [])
            if code not in (None, '') and label
        }

        new_key = _collapse_spaces(_normalize(new_label))
        if new_key in default_labels_normalized:
            return Response(
                {'error': 'Não é permitido renomear para um tipo padronizado (lista fixa).'},
                status=status.HTTP_409_CONFLICT,
            )

        collision = CaseTipoAcaoOption.objects.filter(key=new_key).exclude(id=opt.id).first()
        if collision:
            return Response(
                {'error': 'Já existe uma opção com este nome.'},
                status=status.HTTP_409_CONFLICT,
            )

        old_label = opt.label
        opt.label = new_label
        opt.key = new_key
        opt.save(update_fields=['label', 'key', 'updated_at'])

        # Aproveita o rename para corrigir dados já salvos (quando eram customizados como texto livre).
        # Isso mantém consistência global após correção de digitação.
        if old_label and old_label != new_label:
            Case.objects.filter(tipo_acao=old_label).update(tipo_acao=new_label)

        return Response(
            {'id': opt.id, 'value': opt.label, 'label': opt.label, 'editable': True},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get', 'post'], url_path='titulo-options')
    def titulo_options(self, request):
        """Lista e cadastra opções compartilhadas para `titulo`.

        - GET: retorna opções persistidas + sugestões dinâmicas dos próprios Cases
        - POST: cria (ou retorna existente) com dedup por label normalizada

        Suporta `?q=` para reduzir resultados (útil quando a lista cresce).
        """

        query = _collapse_spaces(request.query_params.get('q') or '').strip()
        normalized_q = _normalize(query)

        if request.method.upper() == 'GET':
            persisted_qs = CaseTituloOption.objects.filter(is_active=True)
            if query:
                persisted_qs = persisted_qs.filter(label__icontains=query)

            persisted = [
                {'id': opt.id, 'value': opt.label, 'label': opt.label, 'editable': True}
                for opt in persisted_qs.order_by('label')[:200]
            ]

            # Sugestões dinâmicas: títulos já usados em processos.
            cases_qs = Case.objects.filter(deleted=False).exclude(titulo__isnull=True).exclude(titulo='')
            if query:
                # Pré-filtro por icontains (rápido) e depois refina com normalize (sem acento).
                cases_qs = cases_qs.filter(titulo__icontains=query)

            raw_titles = list(cases_qs.values_list('titulo', flat=True).distinct()[:400])

            dynamic = []
            for title in raw_titles:
                cleaned = _collapse_spaces(title).strip()
                if not cleaned:
                    continue
                if normalized_q and normalized_q not in _normalize(cleaned):
                    continue
                dynamic.append({'value': cleaned, 'label': cleaned, 'editable': False})

            # Dedup por label normalizada; persistidas têm prioridade.
            seen = set()
            merged = []
            for opt in persisted + dynamic:
                key = _collapse_spaces(_normalize(opt.get('label')))
                if not key or key in seen:
                    continue
                seen.add(key)
                merged.append(opt)

            return Response(merged[:250])

        raw_label = request.data.get('label') or request.data.get('value') or ''
        label = _collapse_spaces(raw_label).strip()
        if not label:
            return Response({'error': 'label é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        key = _collapse_spaces(_normalize(label))

        existing = CaseTituloOption.objects.filter(key=key).first()
        if existing:
            return Response({'id': existing.id, 'value': existing.label, 'label': existing.label, 'editable': True}, status=status.HTTP_200_OK)

        try:
            created = CaseTituloOption.objects.create(
                label=label,
                key=key,
                created_by=request.user if getattr(request.user, 'is_authenticated', False) else None,
            )
        except IntegrityError:
            created = CaseTituloOption.objects.filter(key=key).first()

        if not created:
            return Response({'error': 'Falha ao criar opção'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'id': created.id, 'value': created.label, 'label': created.label, 'editable': True}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['patch'], url_path='titulo-options/(?P<option_id>\\d+)')
    def update_titulo_option(self, request, option_id=None):
        """Edita (rename) uma opção persistida de `titulo` e ajusta Cases existentes."""
        try:
            option_id_int = int(option_id)
        except (TypeError, ValueError):
            return Response({'error': 'ID inválido'}, status=status.HTTP_400_BAD_REQUEST)

        opt = CaseTituloOption.objects.filter(id=option_id_int, is_active=True).first()
        if not opt:
            return Response({'error': 'Opção não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        raw_label = request.data.get('label') or request.data.get('value') or ''
        new_label = _collapse_spaces(raw_label).strip()
        if not new_label:
            return Response({'error': 'label é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        new_key = _collapse_spaces(_normalize(new_label))
        collision = CaseTituloOption.objects.filter(key=new_key).exclude(id=opt.id).first()
        if collision:
            return Response({'error': 'Já existe uma opção com este nome.'}, status=status.HTTP_409_CONFLICT)

        old_label = opt.label
        opt.label = new_label
        opt.key = new_key
        opt.save(update_fields=['label', 'key', 'updated_at'])

        if old_label and old_label != new_label:
            Case.objects.filter(titulo=old_label).update(titulo=new_label)

        return Response({'id': opt.id, 'value': opt.label, 'label': opt.label, 'editable': True}, status=status.HTTP_200_OK)

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
