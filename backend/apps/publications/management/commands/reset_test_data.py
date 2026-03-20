from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.cases.models import Case
from apps.notifications.models import Notification
from apps.publications.models import Publication, SearchHistory


class Command(BaseCommand):
    help = (
        'Limpa dados para reteste de publicações.\n'
        'Por padrão remove: publicações, histórico de buscas e notificações de publicações.\n'
        'Opcionalmente remove casos soft-deletados ou todos os casos.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--purge-soft-deleted-cases',
            action='store_true',
            help='Remove fisicamente casos com deleted=True (auditoria local).',
        )
        parser.add_argument(
            '--purge-all-cases',
            action='store_true',
            help='Remove fisicamente TODOS os casos (ATENÇÃO: operação destrutiva).',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Apenas exibe o que seria removido, sem aplicar deleções.',
        )

    def handle(self, *args, **options):
        purge_soft_deleted_cases = options['purge_soft_deleted_cases']
        purge_all_cases = options['purge_all_cases']
        dry_run = options['dry_run']

        if purge_soft_deleted_cases and purge_all_cases:
            raise CommandError('Use apenas uma opção: --purge-soft-deleted-cases OU --purge-all-cases.')

        publication_qs = Publication.objects.all()
        history_qs = SearchHistory.objects.all()
        notification_qs = Notification.objects.filter(type='publication')

        soft_deleted_cases_qs = Case.objects.filter(deleted=True)
        all_cases_qs = Case.objects.all()

        summary = {
            'publications': publication_qs.count(),
            'search_history': history_qs.count(),
            'publication_notifications': notification_qs.count(),
            'soft_deleted_cases': soft_deleted_cases_qs.count(),
            'all_cases': all_cases_qs.count(),
        }

        self.stdout.write(self.style.WARNING('=== RESET TEST DATA ==='))
        self.stdout.write(f"Publicações: {summary['publications']}")
        self.stdout.write(f"Histórico de buscas: {summary['search_history']}")
        self.stdout.write(f"Notificações de publicação: {summary['publication_notifications']}")
        self.stdout.write(f"Casos soft-deletados: {summary['soft_deleted_cases']}")
        self.stdout.write(f"Casos totais: {summary['all_cases']}")

        if dry_run:
            self.stdout.write(self.style.SUCCESS('DRY-RUN finalizado (nenhuma alteração aplicada).'))
            return

        with transaction.atomic():
            removed_publications = publication_qs.delete()[0]
            removed_history = history_qs.delete()[0]
            removed_notifications = notification_qs.delete()[0]

            removed_cases = 0
            if purge_soft_deleted_cases:
                removed_cases = soft_deleted_cases_qs.delete()[0]
            elif purge_all_cases:
                removed_cases = all_cases_qs.delete()[0]

        self.stdout.write(self.style.SUCCESS('✅ Limpeza concluída.'))
        self.stdout.write(f'Registros removidos (publicações): {removed_publications}')
        self.stdout.write(f'Registros removidos (histórico): {removed_history}')
        self.stdout.write(f'Registros removidos (notificações publicação): {removed_notifications}')

        if purge_soft_deleted_cases:
            self.stdout.write(f'Registros removidos (casos soft-deletados): {removed_cases}')
        elif purge_all_cases:
            self.stdout.write(f'Registros removidos (todos os casos): {removed_cases}')
        else:
            self.stdout.write('Casos: preservados (use --purge-soft-deleted-cases ou --purge-all-cases para remover).')
