from __future__ import annotations

from typing import Iterable

from django.core.management.base import BaseCommand
from django.db import transaction


def _load_seed_titles() -> list[str]:
    """Load default titles from application domain defaults.

    Do not use migrations as a runtime source of truth.
    """
    try:
        from apps.cases.defaults import DEFAULT_CASE_TITULOS

        if isinstance(DEFAULT_CASE_TITULOS, list) and DEFAULT_CASE_TITULOS:
            return [str(v) for v in DEFAULT_CASE_TITULOS]
    except Exception:
        pass

    # Fallback minimal (should rarely happen)
    return [
        'Ação de Cobrança',
        'Cumprimento de Sentença',
        'Execução Fiscal',
        'Inventário',
    ]


def _load_seed_tipo_acao() -> list[str]:
    """Load default tipo_acao labels from application domain defaults.

    Do not use migrations as a runtime source of truth.
    """
    try:
        from apps.cases.defaults import CASE_TIPO_ACAO_CHOICES

        values = [label for _, label in (CASE_TIPO_ACAO_CHOICES or [])]
        if values:
            return [str(v) for v in values]
    except Exception:
        pass

    # Fallback minimal (should rarely happen)
    return [
        'Cível',
        'Criminal',
        'Trabalhista',
        'Tributária',
        'Família',
        'Consumidor',
        'Outros',
    ]


def _load_seed_vinculo_tipo() -> list[str]:
    """Load default vínculo tipo labels from application model defaults.

    Do not use migrations as a runtime source of truth.
    """

    try:
        from apps.cases.models import Case

        values = [label for _, label in (getattr(Case, 'VINCULO_TIPO_CHOICES', None) or [])]
        if values:
            return [str(v) for v in values]
    except Exception:
        pass

    # Fallback minimal (should rarely happen)
    return [
        'Derivado',
        'Apenso',
        'Incidente',
        'Cumprimento de Sentença',
        'Recurso',
        'Outro',
    ]


class Command(BaseCommand):
    help = (
        'Repopula opções persistidas dos dropdowns do Case (Título / Tipo de Ação / Vínculo Tipo). '
        'Útil após purge_system_data para voltar a ter opções offline.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--titles',
            action='store_true',
            help='Seed apenas CaseTituloOption',
        )
        parser.add_argument(
            '--tipo-acao',
            action='store_true',
            help='Seed apenas CaseTipoAcaoOption',
        )
        parser.add_argument(
            '--vinculo-tipo',
            action='store_true',
            help='Seed apenas CaseVinculoTipoOption',
        )
        parser.add_argument(
            '--clear-first',
            action='store_true',
            help='Apaga as opções existentes antes de semear (cuidado: remove customizações)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostra o que faria, sem escrever no banco',
        )

    def _iter_selected_targets(self, only_titles: bool, only_tipo_acao: bool, only_vinculo_tipo: bool) -> Iterable[str]:
        if only_titles and not only_tipo_acao and not only_vinculo_tipo:
            return ['titles']
        if only_tipo_acao and not only_titles and not only_vinculo_tipo:
            return ['tipo_acao']
        if only_vinculo_tipo and not only_titles and not only_tipo_acao:
            return ['vinculo_tipo']
        return ['titles', 'tipo_acao', 'vinculo_tipo']

    def handle(self, *args, **options):
        from apps.cases.models import CaseTipoAcaoOption, CaseTituloOption, CaseVinculoTipoOption

        only_titles = bool(options.get('titles'))
        only_tipo_acao = bool(options.get('tipo_acao'))
        only_vinculo_tipo = bool(options.get('vinculo_tipo'))
        clear_first = bool(options.get('clear_first'))
        dry_run = bool(options.get('dry_run'))

        selected = list(self._iter_selected_targets(only_titles, only_tipo_acao, only_vinculo_tipo))

        self.stdout.write('\n' + '=' * 70)
        self.stdout.write('SEED CASE SELECT OPTIONS')
        self.stdout.write('=' * 70)
        self.stdout.write(f'Selected: {", ".join(selected)}')
        self.stdout.write(f'Clear first: {clear_first}')
        self.stdout.write(f'Dry-run: {dry_run}')

        titles_seed = _load_seed_titles()
        tipo_acao_seed = _load_seed_tipo_acao()
        vinculo_tipo_seed = _load_seed_vinculo_tipo()

        before_titles = CaseTituloOption.objects.count()
        before_tipo = CaseTipoAcaoOption.objects.count()
        before_vinculo = CaseVinculoTipoOption.objects.count()

        if dry_run:
            self.stdout.write('\nResumo atual:')
            self.stdout.write(f' - cases.CaseTituloOption: {before_titles}')
            self.stdout.write(f' - cases.CaseTipoAcaoOption: {before_tipo}')
            self.stdout.write(f' - cases.CaseVinculoTipoOption: {before_vinculo}')

            self.stdout.write('\nO que seria semeado:')
            if 'titles' in selected:
                self.stdout.write(f' - Títulos (TITULOS_SEED): {len(titles_seed)}')
            if 'tipo_acao' in selected:
                self.stdout.write(f' - Tipo de Ação (TIPO_ACAO_SEED): {len(tipo_acao_seed)}')
            if 'vinculo_tipo' in selected:
                self.stdout.write(f' - Vínculo Tipo (VINCULO_TIPO_SEED): {len(vinculo_tipo_seed)}')

            self.stdout.write('\nDry-run: nenhuma alteração foi feita.')
            return

        with transaction.atomic():
            if clear_first:
                if 'titles' in selected:
                    deleted, _ = CaseTituloOption.objects.all().delete()
                    self.stdout.write(f'✓ Cleared CaseTituloOption: {deleted}')
                if 'tipo_acao' in selected:
                    deleted, _ = CaseTipoAcaoOption.objects.all().delete()
                    self.stdout.write(f'✓ Cleared CaseTipoAcaoOption: {deleted}')
                if 'vinculo_tipo' in selected:
                    deleted, _ = CaseVinculoTipoOption.objects.all().delete()
                    self.stdout.write(f'✓ Cleared CaseVinculoTipoOption: {deleted}')

            created_titles = 0
            reactivated_titles = 0
            if 'titles' in selected:
                for raw in titles_seed:
                    label = ' '.join(str(raw or '').split()).strip()
                    if not label:
                        continue
                    key = CaseTituloOption.normalize_key(label)
                    if not key:
                        continue

                    obj, created = CaseTituloOption.objects.get_or_create(
                        key=key,
                        defaults={'label': label, 'is_active': True, 'created_by': None},
                    )
                    if created:
                        created_titles += 1
                    else:
                        needs_update = False
                        if not obj.is_active:
                            obj.is_active = True
                            needs_update = True
                        if obj.label != label:
                            # Mantém o label existente se for customizado; só ajusta quando bate exatamente.
                            # Aqui preferimos NÃO sobrescrever para evitar apagar padronização local.
                            pass
                        if needs_update:
                            obj.save(update_fields=['is_active'])
                            reactivated_titles += 1

                self.stdout.write(
                    f'✓ Seed titles: created={created_titles}, reactivated={reactivated_titles}, total={CaseTituloOption.objects.count()}'
                )

            created_tipo = 0
            reactivated_tipo = 0
            if 'tipo_acao' in selected:
                for raw in tipo_acao_seed:
                    label = ' '.join(str(raw or '').split()).strip()
                    if not label:
                        continue
                    key = CaseTipoAcaoOption.normalize_key(label)
                    if not key:
                        continue

                    obj, created = CaseTipoAcaoOption.objects.get_or_create(
                        key=key,
                        defaults={'label': label, 'is_active': True, 'created_by': None},
                    )
                    if created:
                        created_tipo += 1
                    else:
                        if not obj.is_active:
                            obj.is_active = True
                            obj.save(update_fields=['is_active'])
                            reactivated_tipo += 1

                self.stdout.write(
                    f'✓ Seed tipo_acao: created={created_tipo}, reactivated={reactivated_tipo}, total={CaseTipoAcaoOption.objects.count()}'
                )

            created_vinculo = 0
            reactivated_vinculo = 0
            if 'vinculo_tipo' in selected:
                for raw in vinculo_tipo_seed:
                    label = ' '.join(str(raw or '').split()).strip()
                    if not label:
                        continue
                    key = CaseVinculoTipoOption.normalize_key(label)
                    if not key:
                        continue

                    obj, created = CaseVinculoTipoOption.objects.get_or_create(
                        key=key,
                        defaults={'label': label, 'is_active': True, 'created_by': None},
                    )
                    if created:
                        created_vinculo += 1
                    else:
                        if not obj.is_active:
                            obj.is_active = True
                            obj.save(update_fields=['is_active'])
                            reactivated_vinculo += 1

                self.stdout.write(
                    f'✓ Seed vinculo_tipo: created={created_vinculo}, reactivated={reactivated_vinculo}, total={CaseVinculoTipoOption.objects.count()}'
                )

        self.stdout.write('\n✅ Seed concluído.')
