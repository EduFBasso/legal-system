"""
Views REST API para o app de contatos.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
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
    
    queryset = Contact.objects.all().order_by('name')
    
    # Filtros e busca
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    
    # Campos para filtrar (ex: /api/contacts/?contact_type=CLIENT)
    filterset_fields = ['contact_type', 'person_type', 'state', 'city']
    
    # Campos para buscar (ex: /api/contacts/?search=joão)
    search_fields = ['name', 'document_number', 'email', 'phone', 'mobile']
    
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
    
    def perform_create(self, serializer):
        """
        Hook executado ao criar contato.
        Pode adicionar lógica extra aqui (logs, notificações, etc).
        """
        contact = serializer.save()
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
            "by_type": {"CLIENT": 120, "OPPOSING": 25, "WITNESS": 11},
            "by_person_type": {"PF": 140, "PJ": 16},
            "with_photo": 45,
            "with_email": 130
        }
        """
        from django.db.models import Count, Q
        
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_type': dict(
                queryset.values_list('contact_type')
                .annotate(count=Count('id'))
            ),
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
