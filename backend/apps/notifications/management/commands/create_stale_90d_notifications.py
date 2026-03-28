from __future__ import annotations

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.cases.models import Case
from apps.notifications.models import Notification


class Command(BaseCommand):
    help = (
        "Cria notificações reais para processos sem movimentação há N dias "
        "(padrão: 90). Evita spam criando no máximo 1 notificação por processo por dia."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=90,
            help="Número de dias sem movimentação para alertar (padrão: 90).",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Máximo de notificações a criar por execução (0 = sem limite).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Não cria notificações; apenas mostra quantas seriam criadas.",
        )

    def handle(self, *args, **options):
        days: int = options["days"]
        limit: int = options["limit"]
        dry_run: bool = bool(options["dry_run"])

        if days <= 0:
            self.stderr.write(self.style.ERROR("--days deve ser > 0"))
            return
        if limit < 0:
            self.stderr.write(self.style.ERROR("--limit deve ser >= 0"))
            return

        today = timezone.now().date()
        threshold_date = today - timedelta(days=days)

        qs = (
            Case.objects.filter(
                deleted=False,
                data_ultima_movimentacao__isnull=False,
                data_ultima_movimentacao__lte=threshold_date,
            )
            .exclude(status__in=["INATIVO", "ARQUIVADO", "ENCERRADO"])
            .select_related("owner")
            .order_by("data_ultima_movimentacao")
        )

        created = 0
        skipped = 0
        candidates = 0

        for case in qs.iterator():
            if limit and created >= limit:
                break

            candidates += 1
            days_without_activity = (today - case.data_ultima_movimentacao).days

            # Evita criar spam: no máximo 1 notificação por processo por dia.
            already_exists = Notification.objects.filter(
                owner=case.owner,
                type="process",
                metadata__alert_type="stale_90_days",
                metadata__case_id=case.id,
                created_at__date=today,
            ).exists()

            if already_exists:
                skipped += 1
                continue

            if dry_run:
                created += 1
                continue

            Notification.objects.create(
                owner=case.owner,
                type="process",
                priority="high",
                title=f"⚠ Processo sem movimentação há {days_without_activity} dias",
                message=(
                    f"Processo {case.numero_processo} está sem publicação/movimentação "
                    f"há {days_without_activity} dias (última em {case.data_ultima_movimentacao.strftime('%d/%m/%Y')})."
                ),
                link=f"/cases/{case.id}",
                metadata={
                    "alert_type": "stale_90_days",
                    "case_id": case.id,
                    "case_number": case.numero_processo,
                    "days_without_activity": days_without_activity,
                    "last_movement_date": case.data_ultima_movimentacao.isoformat(),
                },
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"create_stale_90d_notifications: candidates={candidates} created={created} skipped={skipped} "
                f"(days>={days}, limit={limit}, dry_run={dry_run})"
            )
        )
