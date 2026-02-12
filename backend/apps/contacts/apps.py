from django.apps import AppConfig


class ContactsConfig(AppConfig):
    """
    Configuração do app de contatos (clientes e partes envolvidas).
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.contacts'
    verbose_name = 'Contatos'
