from datetime import date, timedelta

from django.test import TestCase

from apps.cases.models import Case, CaseMovement
from apps.publications.models import Publication
from apps.publications.views import _create_movement_from_publication, _extract_prazo_days


class PublicationMovementDeadlineTests(TestCase):
	def setUp(self):
		self.case = Case.objects.create(
			numero_processo='0000618-47.2026.8.26.0320',
			titulo='Cumprimento de sentença',
			tribunal='TJSP',
			comarca='Limeira',
			status='ATIVO',
		)

	def test_extract_prazo_days_from_text(self):
		texto = (
			'Fica intimado o exequente para que, no prazo de 15 (quinze) dias, '
			'proceda a inclusão das custas no demonstrativo de débito.'
		)
		self.assertEqual(_extract_prazo_days(texto), 15)

	def test_extract_prazo_days_returns_none_when_not_found(self):
		texto = 'Despacho sem prazo processual explícito para cumprimento.'
		self.assertIsNone(_extract_prazo_days(texto))

	def test_create_movement_from_publication_sets_prazo_and_deadline(self):
		publication = Publication.objects.create(
			id_api=533297236,
			numero_processo='0000618-47.2026.8.26.0320',
			tribunal='TJSP',
			tipo_comunicacao='Intimação',
			data_disponibilizacao=date(2026, 2, 18),
			orgao='Foro de Limeira - 4ª Vara Cível',
			meio='D',
			texto_resumo='Intimação para inclusão de custas no prazo legal.',
			texto_completo=(
				'Como o cumprimento de sentença foi iniciado, fica intimado o exequente '
				'para que, no prazo de 15 (quinze) dias, proceda à inclusão das custas.'
			),
		)

		_create_movement_from_publication(publication, self.case)

		movement = CaseMovement.objects.get(case=self.case, publicacao_id=publication.id_api)
		self.assertEqual(movement.prazo, 15)
		self.assertEqual(
			movement.data_limite_prazo,
			publication.data_disponibilizacao + timedelta(days=15),
		)
