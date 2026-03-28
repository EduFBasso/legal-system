from __future__ import annotations

from datetime import date

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.notifications.models import SystemSetting


def _get_setting(key: str, default):
    row = SystemSetting.objects.filter(key=key).values_list("value", flat=True).first()
    return default if row is None else row


class Command(BaseCommand):
    help = (
        "Executa o monitoramento de processos sem movimentação (90+ dias) na hora configurada. "
        "Ideal para ser agendado em loop (ex.: a cada 5 minutos) via Task Scheduler/cron."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Executa independente de horário e do last_run (útil para teste).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Não cria notificações; apenas mostra quantas seriam criadas.",
        )

    def handle(self, *args, **options):
        force: bool = bool(options["force"])
        dry_run: bool = bool(options["dry_run"])

        enabled = bool(_get_setting("STALE_PROCESS_MONITOR_ENABLED", False))
        schedule_time = str(_get_setting("STALE_PROCESS_MONITOR_TIME", "09:00") or "09:00")
        threshold_days = int(_get_setting("STALE_PROCESS_DAYS_THRESHOLD", 90) or 90)

        now = timezone.localtime(timezone.now())
        today = now.date()

        last_run_value = _get_setting("STALE_PROCESS_MONITOR_LAST_RUN", None)
        last_run_date: date | None = None
        if isinstance(last_run_value, str):
            try:
                last_run_date = date.fromisoformat(last_run_value)
            except ValueError:
                last_run_date = None

        if not enabled and not force:
            self.stdout.write(self.style.WARNING("stale monitor disabled"))
            return

        if not force:
            # Rodar no máximo 1x por dia.
            if last_run_date == today:
                self.stdout.write(self.style.WARNING("stale monitor already ran today"))
                return

            # Só roda depois da hora configurada (HH:MM).
            try:
                hour = int(schedule_time[0:2])
                minute = int(schedule_time[3:5])
            except Exception:
                hour = 9
                minute = 0

            if (now.hour, now.minute) < (hour, minute):
                self.stdout.write(self.style.WARNING("stale monitor not due yet"))
                return

        call_command(
            "create_stale_90d_notifications",
            days=threshold_days,
            limit=0,
            dry_run=dry_run,
        )

        if not dry_run:
            SystemSetting.objects.update_or_create(
                key="STALE_PROCESS_MONITOR_LAST_RUN",
                defaults={"value": today.isoformat()},
            )

        self.stdout.write(self.style.SUCCESS("stale monitor run complete"))
