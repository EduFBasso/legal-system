from datetime import date, timedelta

from django.test import TestCase
from django.urls import reverse

from apps.cases.models import Case, CaseMovement
from apps.publications.models import Publication, SearchHistory
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


class PublicationAutoIntegrateRelatedTests(TestCase):
	def setUp(self):
		self.case = Case.objects.create(
			numero_processo='0000618-47.2026.8.26.0320',
			titulo='Cumprimento de sentença',
			tribunal='TJSP',
			comarca='Limeira',
			status='ATIVO',
		)

		self.pub_current = Publication.objects.create(
			id_api=700000001,
			numero_processo='0000618-47.2026.8.26.0320',
			tribunal='TJSP',
			tipo_comunicacao='Intimação',
			data_disponibilizacao=date(2026, 2, 20),
			orgao='4ª Vara Cível',
			meio='D',
			texto_resumo='Publicação atual',
			texto_completo='Publicação atual com prazo de 10 dias.',
			integration_status='PENDING',
		)

		self.pub_related_pending = Publication.objects.create(
			id_api=700000002,
			numero_processo='00006184720268260320',  # mesmo processo sem máscara
			tribunal='TJSP',
			tipo_comunicacao='Despacho',
			data_disponibilizacao=date(2026, 2, 10),
			orgao='4ª Vara Cível',
			meio='D',
			texto_resumo='Publicação antiga pendente',
			texto_completo='Publicação antiga pendente.',
			integration_status='PENDING',
		)

		self.pub_other_process = Publication.objects.create(
			id_api=700000003,
			numero_processo='1000000-00.2025.8.26.0100',
			tribunal='TJSP',
			tipo_comunicacao='Intimação',
			data_disponibilizacao=date(2026, 2, 11),
			orgao='1ª Vara',
			meio='D',
			texto_resumo='Outro processo',
			texto_completo='Outro processo.',
			integration_status='PENDING',
		)

	def test_integrate_publication_auto_integrates_related_pending_same_process(self):
		url = reverse('publications:integrate_publication', kwargs={'id_api': self.pub_current.id_api})
		response = self.client.post(
			url,
			data={
				'case_id': self.case.id,
				'create_movement': True,
			},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertTrue(payload['success'])
		self.assertEqual(payload['related_integrated'], 1)
		self.assertEqual(payload['related_movements_created'], 1)

		self.pub_current.refresh_from_db()
		self.pub_related_pending.refresh_from_db()
		self.pub_other_process.refresh_from_db()

		self.assertEqual(self.pub_current.integration_status, 'INTEGRATED')
		self.assertEqual(self.pub_current.case_id, self.case.id)

		self.assertEqual(self.pub_related_pending.integration_status, 'INTEGRATED')
		self.assertEqual(self.pub_related_pending.case_id, self.case.id)

		self.assertEqual(self.pub_other_process.integration_status, 'PENDING')
		self.assertIsNone(self.pub_other_process.case_id)

		mov_current = CaseMovement.objects.filter(
			case=self.case,
			publicacao_id=self.pub_current.id_api,
		).count()
		mov_related = CaseMovement.objects.filter(
			case=self.case,
			publicacao_id=self.pub_related_pending.id_api,
		).count()

		self.assertEqual(mov_current, 1)
		self.assertEqual(mov_related, 1)

	def test_integrate_publication_does_not_duplicate_existing_movement(self):
		CaseMovement.objects.create(
			case=self.case,
			data=self.pub_current.data_disponibilizacao,
			tipo='INTIMACAO',
			titulo='Já existente',
			descricao='Movimentação já existente',
			origem='DJE',
			publicacao_id=self.pub_current.id_api,
		)

		url = reverse('publications:integrate_publication', kwargs={'id_api': self.pub_current.id_api})
		response = self.client.post(
			url,
			data={
				'case_id': self.case.id,
				'create_movement': True,
				'auto_integrate_related': False,
			},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertTrue(payload['success'])
		self.assertFalse(payload['movement_created'])

		self.assertEqual(
			CaseMovement.objects.filter(
				case=self.case,
				publicacao_id=self.pub_current.id_api,
			).count(),
			1,
		)


class PublicationBatchIntegrateManualCaseFallbackTests(TestCase):
	def setUp(self):
		self.case = Case.objects.create(
			numero_processo='0000618-47.2026.8.26.0320',
			titulo='Caso manual sem campo derivado',
			tribunal='TJSP',
			comarca='Limeira',
			status='ATIVO',
		)

		# Simula cenário legado/manual: campo derivado vazio
		Case.objects.filter(id=self.case.id).update(numero_processo_unformatted='')
		self.case.refresh_from_db()

		self.search = SearchHistory.objects.create(
			data_inicio=date(2026, 2, 10),
			data_fim=date(2026, 2, 20),
			tribunais=['TJSP'],
			total_publicacoes=1,
			total_novas=1,
		)

		self.pub = Publication.objects.create(
			id_api=800000001,
			numero_processo='0000618-47.2026.8.26.0320',
			tribunal='TJSP',
			tipo_comunicacao='Intimação',
			data_disponibilizacao=date(2026, 2, 15),
			orgao='4ª Vara Cível',
			meio='D',
			texto_resumo='Publicação para caso manual',
			texto_completo='Publicação para validar fallback de integração.',
			integration_status='PENDING',
		)

	def test_batch_integrate_finds_manual_case_without_unformatted_field(self):
		url = reverse('publications:batch_integrate_publications')
		response = self.client.post(
			url,
			data={
				'search_id': self.search.id,
				'auto_link': True,
				'create_movement': False,
			},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertTrue(payload['success'])
		self.assertEqual(payload['integrated'], 1)

		self.pub.refresh_from_db()
		self.assertEqual(self.pub.integration_status, 'INTEGRATED')
		self.assertEqual(self.pub.case_id, self.case.id)
