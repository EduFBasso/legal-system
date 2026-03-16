"""
Models para gestão de contatos (clientes e partes envolvidas).
"""
from django.db import models
from django.core.validators import RegexValidator
from django.conf import settings


from apps.organizations.models import Organization

class Contact(models.Model):
    """
    Representa um contato (pessoa física ou jurídica).
    O papel do contato em cada processo é definido através de CaseParty.
    Sistema inspirado em mini-cards com exibição condicional de campos.
    """
    
    # Tipo de pessoa
    PERSON_TYPE_CHOICES = [
        ('PF', 'Pessoa Física'),
        ('PJ', 'Pessoa Jurídica'),
    ]
    
    # === Identificação ===
    person_type = models.CharField(
        'Tipo de Pessoa', 
        max_length=2, 
        choices=PERSON_TYPE_CHOICES,
        default='PF'
    )
    
    # Dados básicos (sempre visível no mini-card)
    name = models.CharField('Nome/Razão Social', max_length=200)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_contacts',
        db_index=True,
        help_text='Responsável pelo escopo deste contato'
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts',
        help_text='Organização (tenant) deste contato'
    )
    
    # Nome Fantasia (apenas para PJ)
    trading_name = models.CharField(
        'Nome Fantasia',
        max_length=200,
        blank=True,
        null=True,
        help_text='Nome fantasia da empresa (diferente da razão social)'
    )
    
    # Documento (opcional mas recomendado)
    document_number = models.CharField(
        'CPF/CNPJ', 
        max_length=18,
        blank=True,
        null=True,
        help_text='Formato: 000.000.000-00 ou 00.000.000/0000-00'
    )
    
    # Foto (modo local - mini no card, grande no modal)
    photo = models.ImageField(
        'Foto',
        upload_to='contacts/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text='Foto do contato - 40x40px no card, 200x200px no modal'
    )
    
    # === Contatos (exibir no card se preenchido) ===
    email = models.EmailField('E-mail', blank=True, null=True)
    phone = models.CharField('Telefone', max_length=20, blank=True, null=True)
    mobile = models.CharField('Celular', max_length=20, blank=True, null=True)
    
    # === Endereço (exibir no card apenas se completo) ===
    zip_code = models.CharField('CEP', max_length=9, blank=True, null=True)
    street = models.CharField('Logradouro', max_length=200, blank=True, null=True)
    number = models.CharField('Número', max_length=10, blank=True, null=True)
    complement = models.CharField('Complemento', max_length=100, blank=True, null=True)
    neighborhood = models.CharField('Bairro', max_length=100, blank=True, null=True)
    city = models.CharField('Cidade', max_length=100, blank=True, null=True)
    state = models.CharField(
        'Estado', 
        max_length=2, 
        blank=True, 
        null=True,
        help_text='Sigla: SP, RJ, MG, etc.'
    )
    
    # === Informações Adicionais ===
    notes = models.TextField('Observações', blank=True, null=True)
    
    # === Metadados ===
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Contato'
        verbose_name_plural = 'Contatos'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['owner', 'name']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_person_type_display()})"

    def save(self, *args, **kwargs):
        if self.organization_id is None:
            if self.owner_id is not None:
                profile = getattr(self.owner, 'profile', None)
                if profile and profile.organization_id is not None:
                    self.organization_id = profile.organization_id

            if self.organization_id is None:
                default_org, _ = Organization.objects.get_or_create(name='Escritório Principal')
                self.organization = default_org
        super().save(*args, **kwargs)
    
    # === Properties para lógica de exibição no mini-card ===
    
    @property
    def has_contact_info(self):
        """Verifica se tem pelo menos um meio de contato (exibir no card)."""
        return any([self.email, self.phone, self.mobile])
    
    @property
    def has_complete_address(self):
        """Verifica se endereço está completo (para exibir no mini-card)."""
        return all([
            self.zip_code,
            self.street,
            self.number,
            self.city,
            self.state
        ])
    
    @property
    def address_oneline(self):
        """Retorna endereço formatado em uma linha para mini-card (inclui CEP)."""
        if not self.has_complete_address:
            return None
        
        # Monta o endereço completo com CEP formatado
        address_parts = [f"CEP: {self.zip_code_formatted}"]  # Inicia com CEP formatado
        address_parts.append(f"{self.street}, {self.number}")
        
        # Adiciona complemento se existir
        if self.complement:
            address_parts.append(self.complement)
        
        # Adiciona bairro
        if self.neighborhood:
            address_parts.append(self.neighborhood)
        
        # Adiciona cidade/estado
        address_parts.append(f"{self.city}/{self.state}")
        
        return " - ".join(filter(None, address_parts))
    
    @property
    def primary_contact(self):
        """Retorna contato principal formatado para exibir no card."""
        # Prioridade: mobile > phone > email
        if self.mobile:
            return self.mobile_formatted
        elif self.phone:
            return self.phone_formatted
        else:
            return self.email
    
    @property
    def document_formatted(self):
        """Retorna documento formatado (CPF ou CNPJ)."""
        if not self.document_number:
            return None
        
        # Remove caracteres não numéricos
        numbers = ''.join(filter(str.isdigit, self.document_number))
        
        if len(numbers) == 11:  # CPF
            return f"{numbers[0:3]}.{numbers[3:6]}.{numbers[6:9]}-{numbers[9:11]}"
        elif len(numbers) == 14:  # CNPJ
            return f"{numbers[0:2]}.{numbers[2:5]}.{numbers[5:8]}/{numbers[8:12]}-{numbers[12:14]}"
        
        return self.document_number
    
    @property
    def phone_formatted(self):
        """Retorna telefone formatado."""
        if not self.phone:
            return None
        
        # Remove caracteres não numéricos
        numbers = ''.join(filter(str.isdigit, self.phone))
        
        if len(numbers) == 10:  # Telefone fixo: (11) 3333-4444
            return f"({numbers[0:2]}) {numbers[2:6]}-{numbers[6:10]}"
        elif len(numbers) == 11:  # Celular: (11) 98765-4321
            return f"({numbers[0:2]}) {numbers[2:7]}-{numbers[7:11]}"
        
        return self.phone
    
    @property
    def mobile_formatted(self):
        """Retorna celular formatado."""
        if not self.mobile:
            return None
        
        # Remove caracteres não numéricos
        numbers = ''.join(filter(str.isdigit, self.mobile))
        
        if len(numbers) == 10:  # Telefone fixo: (11) 3333-4444
            return f"({numbers[0:2]}) {numbers[2:6]}-{numbers[6:10]}"
        elif len(numbers) == 11:  # Celular: (11) 98765-4321
            return f"({numbers[0:2]}) {numbers[2:7]}-{numbers[7:11]}"
        
        return self.mobile
    
    @property
    def zip_code_formatted(self):
        """Retorna CEP formatado."""
        if not self.zip_code:
            return None
        
        # Remove caracteres não numéricos
        numbers = ''.join(filter(str.isdigit, self.zip_code))
        
        if len(numbers) == 8:  # CEP: 12345-678
            return f"{numbers[0:5]}-{numbers[5:8]}"
        
        return self.zip_code
