"""
Models para gestão de contatos (clientes e partes envolvidas).
"""
from django.db import models
from django.core.validators import RegexValidator


class Contact(models.Model):
    """
    Representa um contato - cliente, parte contrária, testemunha, etc.
    Sistema inspirado em mini-cards com exibição condicional de campos.
    """
    
    # Tipo de contato
    CONTACT_TYPE_CHOICES = [
        ('CLIENT', 'Cliente'),
        ('OPPOSING', 'Parte Contrária'),
        ('WITNESS', 'Testemunha'),
        ('LAWYER', 'Advogado Parceiro'),
        ('OTHER', 'Outro'),
    ]
    
    # Tipo de pessoa
    PERSON_TYPE_CHOICES = [
        ('PF', 'Pessoa Física'),
        ('PJ', 'Pessoa Jurídica'),
    ]
    
    # === Identificação ===
    contact_type = models.CharField(
        'Tipo de Contato', 
        max_length=10, 
        choices=CONTACT_TYPE_CHOICES,
        default='CLIENT'
    )
    person_type = models.CharField(
        'Tipo de Pessoa', 
        max_length=2, 
        choices=PERSON_TYPE_CHOICES,
        default='PF'
    )
    
    # Dados básicos (sempre visível no mini-card)
    name = models.CharField('Nome/Razão Social', max_length=200)
    
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
            models.Index(fields=['contact_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_contact_type_display()})"
    
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
        """Retorna endereço formatado em uma linha para mini-card."""
        if not self.has_complete_address:
            return None
        
        parts = [
            f"{self.street}, {self.number}",
            self.neighborhood,
            f"{self.city}/{self.state}"
        ]
        return " - ".join(filter(None, parts))
    
    @property
    def primary_contact(self):
        """Retorna contato principal para exibir no card."""
        return self.mobile or self.phone or self.email
    
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
