"""
Views REST API para o app de contatos.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
from apps.accounts.permissions import is_master_user
from .models import Contact
from .serializers import (
    ContactListSerializer,
    ContactDetailSerializer,
    ContactCreateUpdateSerializer
)


class ContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar contatos via API REST.
    
    Endpoints disponíveis:
    - GET    /api/contacts/          → Lista todos os contatos (sidebar)
    - GET    /api/contacts/{id}/     → Detalhes de um contato (modal)
    - POST   /api/contacts/          → Criar novo contato
    - PUT    /api/contacts/{id}/     → Atualizar contato completo
    - PATCH  /api/contacts/{id}/     → Atualizar parcialmente
    - DELETE /api/contacts/{id}/     → Deletar contato
    - POST   /api/contacts/{id}/upload_photo/ → Upload de foto
    """
    
    queryset = Contact.objects.prefetch_related(
        'case_roles__case'
    ).distinct().order_by('name')
    UserModel = get_user_model()

    def _get_master_scope_user(self):
        user = self.request.user
        if not user.is_authenticated or not is_master_user(user):
            return None

        team_member_id = self.request.query_params.get('team_member_id')
        if not team_member_id:
            return None

        try:
            return self.UserModel.objects.filter(id=int(team_member_id), is_active=True).first()
        except (TypeError, ValueError):
            return None

    def _resolve_contact_owner_for_create(self):
        user = self.request.user
        if not user.is_authenticated:
            return None

        scope_user = self._get_master_scope_user()
        if scope_user is not None:
            return scope_user

        return user

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset

        scope_user = self._get_master_scope_user()
        if scope_user is not None:
            queryset = queryset.filter(Q(owner=scope_user) | Q(owner__isnull=True))
        elif is_master_user(user):
            queryset = queryset
        else:
            queryset = queryset.filter(Q(owner=user) | Q(owner__isnull=True))

        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        if data_inicio:
            queryset = queryset.filter(updated_at__date__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(updated_at__date__lte=data_fim)

        return queryset
    
    # Filtros e busca
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    
    # Campos para filtrar (ex: /api/contacts/?person_type=PF)
    filterset_fields = ['person_type', 'state', 'city']
    
    # Campos para buscar (ex: /api/contacts/?search=joão)
    # Busca em: nome, CPF/CNPJ, email, telefone, celular E número de processo vinculado
    search_fields = [
        'name', 
        'document_number', 
        'email', 
        'phone', 
        'mobile',
        'case_roles__case__numero_processo',  # Busca por processo formatado
        'case_roles__case__numero_processo_unformatted',  # Busca por processo (só números)
    ]
    
    # Campos para ordenar (ex: /api/contacts/?ordering=-created_at)
    ordering_fields = ['name', 'created_at', 'updated_at']
    
    def get_serializer_class(self):
        """
        Retorna o serializer apropriado baseado na action.
        
        - list: ContactListSerializer (mini-card)
        - retrieve: ContactDetailSerializer (modal completo)
        - create/update: ContactCreateUpdateSerializer
        """
        if self.action == 'list':
            return ContactListSerializer
        elif self.action == 'retrieve':
            return ContactDetailSerializer
        else:
            return ContactCreateUpdateSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Override do create para retornar ContactDetailSerializer.
        Garante que o frontend receba todos os campos calculados após CREATE.
        """
        # Valida e cria usando ContactCreateUpdateSerializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        owner = self._resolve_contact_owner_for_create()
        if owner is not None:
            contact = serializer.save(owner=owner)
        else:
            contact = serializer.save()
        
        # Retorna usando ContactDetailSerializer (com campos calculados)
        detail_serializer = ContactDetailSerializer(contact, context={'request': request})
        headers = self.get_success_headers(detail_serializer.data)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """
        Override do update para retornar ContactDetailSerializer.
        Garante que o frontend receba todos os campos calculados após UPDATE.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Valida e atualiza usando ContactCreateUpdateSerializer
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save()
        
        # Retorna usando ContactDetailSerializer (com campos calculados)
        detail_serializer = ContactDetailSerializer(contact, context={'request': request})
        return Response(detail_serializer.data)
    
    def perform_create(self, serializer):
        """
        Hook executado ao criar contato.
        Pode adicionar lógica extra aqui (logs, notificações, etc).
        """
        owner = self._resolve_contact_owner_for_create()
        if owner is None:
            contact = serializer.save()
        else:
            contact = serializer.save(owner=owner)
        # TODO: Emitir evento 'contacts:changed' via WebSocket (futuro)
        return contact
    
    def perform_update(self, serializer):
        """
        Hook executado ao atualizar contato.
        """
        contact = serializer.save()
        # TODO: Emitir evento 'contacts:changed' via WebSocket (futuro)
        return contact
    
    def perform_destroy(self, instance):
        """
        Hook executado ao deletar contato.
        Por enquanto deleta permanentemente.
        TODO: Implementar soft delete se necessário no futuro.
        """
        instance.delete()
        # TODO: Emitir evento 'contacts:changed' via WebSocket (futuro)
    
    @action(detail=True, methods=['post'], url_path='upload-photo')
    def upload_photo(self, request, pk=None):
        """
        Endpoint customizado para upload de foto de perfil.
        
        POST /api/contacts/{id}/upload-photo/
        Body: multipart/form-data com campo 'photo'
        
        Exemplo com curl:
        curl -X POST http://localhost:8000/api/contacts/1/upload-photo/ \
             -F "photo=@foto.jpg"
        """
        contact = self.get_object()
        
        if 'photo' not in request.FILES:
            return Response(
                {'error': 'Campo photo é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        photo = request.FILES['photo']
        
        # Valida tamanho (5MB)
        if photo.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Foto deve ter no máximo 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Valida extensão
        allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
        ext = photo.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            return Response(
                {'error': f'Formato não permitido. Use: {", ".join(allowed_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Salva a foto
        contact.photo = photo
        contact.save()
        
        # Retorna dados atualizados
        serializer = ContactDetailSerializer(contact, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'], url_path='remove-photo')
    def remove_photo(self, request, pk=None):
        """
        Endpoint customizado para remover foto de perfil.
        
        DELETE /api/contacts/{id}/remove-photo/
        """
        contact = self.get_object()
        
        if contact.photo:
            # Deleta o arquivo físico
            contact.photo.delete(save=False)
            contact.photo = None
            contact.save()
            
            return Response(
                {'message': 'Foto removida com sucesso'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'message': 'Contato não possui foto'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        """
        Endpoint customizado para estatísticas (futuro dashboard).
        
        GET /api/contacts/statistics/
        
        Retorna:
        {
            "total": 156,
            "by_person_type": {"PF": 140, "PJ": 16},
            "with_photo": 45,
            "with_email": 130
        }
        """
        from django.db.models import Count, Q
        
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_person_type': dict(
                queryset.values_list('person_type')
                .annotate(count=Count('id'))
            ),
            'with_photo': queryset.exclude(photo='').exclude(photo=None).count(),
            'with_email': queryset.exclude(email='').exclude(email=None).count(),
            'with_complete_address': sum(
                1 for c in queryset if c.has_complete_address
            ),
        }
        
        return Response(stats)
