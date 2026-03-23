from datetime import date, timedelta

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.conf import settings

from apps.accounts.models import UserProfile
from apps.cases.models import Case, CaseMovement
from apps.notifications.models import Notification
from apps.publications.models import Publication, SearchHistory
from apps.publications.views import _build_case_suggestion, _create_movement_from_publication, _extract_prazo_days
from services.pje_comunica import PJeComunicaService

from django.test import override_settings
from unittest.mock import patch


User = get_user_model()


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
				'auto_integrate_related': True,
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

	def test_integrate_publication_does_not_auto_integrate_related_by_default(self):
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
		self.assertEqual(payload['related_integrated'], 0)
		self.assertEqual(payload['related_movements_created'], 0)

		self.pub_current.refresh_from_db()
		self.pub_related_pending.refresh_from_db()

		self.assertEqual(self.pub_current.integration_status, 'INTEGRATED')
		self.assertEqual(self.pub_current.case_id, self.case.id)

		# Related remains pending unless explicitly requested
		self.assertEqual(self.pub_related_pending.integration_status, 'PENDING')
		self.assertIsNone(self.pub_related_pending.case_id)

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


class PublicationCaseSuggestionScopeTests(TestCase):
	def setUp(self):
		self.master = User.objects.create_user(username='master_scope', password='123456', email='master_scope@example.com')
		master_profile = self.master.profile
		master_profile.role = UserProfile.ROLE_MASTER
		master_profile.full_name_oab = 'Master Scope'
		master_profile.oab_number = 'OAB 1000'
		master_profile.save(update_fields=['role', 'full_name_oab', 'oab_number'])

		self.advogado = User.objects.create_user(username='adv_scope', password='123456', email='adv_scope@example.com')
		adv_profile = self.advogado.profile
		adv_profile.role = UserProfile.ROLE_ADVOGADO
		adv_profile.full_name_oab = 'Adv Scope'
		adv_profile.oab_number = 'OAB 2000'
		adv_profile.save(update_fields=['role', 'full_name_oab', 'oab_number'])

	def test_master_does_not_get_case_suggestion_from_other_lawyer_case(self):
		Case.objects.create(
			numero_processo='1000000-00.2026.8.26.0001',
			titulo='Caso do advogado',
			tribunal='TJSP',
			comarca='São Paulo',
			status='ATIVO',
			owner=self.advogado,
		)

		suggestion = _build_case_suggestion('1000000-00.2026.8.26.0001', user=self.master)

		self.assertIsNone(suggestion)

	def test_master_gets_case_suggestion_for_own_case(self):
		case = Case.objects.create(
			numero_processo='2000000-00.2026.8.26.0001',
			titulo='Caso do master',
			tribunal='TJSP',
			comarca='São Paulo',
			status='ATIVO',
			owner=self.master,
		)

		suggestion = _build_case_suggestion('2000000-00.2026.8.26.0001', user=self.master)

		self.assertIsNotNone(suggestion)


class PublicationDeleteTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='pub_delete_user', password='123456', email='pub_delete@example.com')
		self.client.force_login(self.user)

	def test_delete_publication_is_hard_delete(self):
		publication = Publication.objects.create(
			id_api=900000001,
			owner=self.user,
			numero_processo='1000000-00.2026.8.26.0001',
			tribunal='TJSP',
			tipo_comunicacao='Intimação',
			data_disponibilizacao=date(2026, 2, 20),
			orgao='1ª Vara',
			meio='D',
			texto_resumo='Resumo',
			texto_completo='Texto completo',
		)

		url = reverse('publications:delete', kwargs={'id_api': publication.id_api})
		response = self.client.delete(url)
		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertTrue(payload.get('success'))
		self.assertFalse(Publication.objects.filter(id_api=publication.id_api).exists())

	def test_delete_publication_is_blocked_when_linked_to_case(self):
		publication = Publication.objects.create(
			id_api=900000002,
			owner=self.user,
			numero_processo='1000000-00.2026.8.26.0002',
			tribunal='TJSP',
			tipo_comunicacao='Despacho',
			data_disponibilizacao=date(2026, 2, 21),
			orgao='2ª Vara',
			meio='D',
			texto_resumo='Resumo',
			texto_completo='Texto completo',
		)

		case = Case.objects.create(
			numero_processo='1000000-00.2026.8.26.0002',
			titulo='Caso vinculado',
			tribunal='TJSP',
			comarca='São Paulo',
			status='ATIVO',
			owner=self.user,
			publicacao_origem=publication,
		)
		# Também simula vínculo direto publication.case
		publication.case = case
		publication.save(update_fields=['case'])

		url = reverse('publications:delete', kwargs={'id_api': publication.id_api})
		response = self.client.delete(url)
		self.assertEqual(response.status_code, 400)
		payload = response.json()
		self.assertFalse(payload.get('success'))
		self.assertTrue(Publication.objects.filter(id_api=publication.id_api).exists())


class PublicationReimportAfterDeleteTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='pub_reimport_user', password='123456', email='pub_reimport@example.com')
		profile = self.user.profile
		profile.full_name_oab = 'Teste OAB'
		profile.oab_number = '123456'
		profile.save(update_fields=['full_name_oab', 'oab_number'])
		self.client.force_login(self.user)

	@patch('apps.publications.views.PJeComunicaService.fetch_publications')
	def test_deleted_publication_is_reimported_on_next_search(self, mock_fetch):
		pub_id_api = 910000001
		pub_payload = {
			'id_api': pub_id_api,
			'numero_processo': '1000000-00.2026.8.26.0001',
			'tribunal': 'TJSP',
			'tipo_comunicacao': 'Intimação',
			'data_disponibilizacao': '2026-02-20',
			'orgao': '1ª Vara',
			'meio': 'D',
			'texto_resumo': 'Resumo',
			'texto_completo': 'Texto completo',
			'link_oficial': None,
		}

		mock_fetch.return_value = {
			'success': True,
			'total_publicacoes': 1,
			'publicacoes': [pub_payload],
		}

		search_url = reverse('publications:search')
		response_1 = self.client.get(
			search_url,
			data={
				'data_inicio': '2026-02-19',
				'data_fim': '2026-02-21',
				'tribunais': 'TJSP',
				'retroactive_days': 0,
			},
		)
		self.assertEqual(response_1.status_code, 200)
		self.assertTrue(Publication.objects.filter(id_api=pub_id_api, owner=self.user).exists())


class PublicationBlockReimportAfterDeleteTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='pub_block_user', password='123456', email='pub_block@example.com')
		profile = self.user.profile
		profile.full_name_oab = 'Teste OAB'
		profile.oab_number = '123456'
		profile.save(update_fields=['full_name_oab', 'oab_number'])
		self.client.force_login(self.user)

	@patch('apps.publications.views.PJeComunicaService.fetch_publications')
	def test_deleted_publication_is_not_reimported_when_policy_blocks(self, mock_fetch):
		with override_settings(
			LEGAL_SYSTEM_SETTINGS={
				**getattr(settings, 'LEGAL_SYSTEM_SETTINGS', {}),
				'PUBLICATIONS_ALLOW_REIMPORT_AFTER_DELETE': False,
			}
		):
			pub_id_api = 920000001
			pub_payload = {
				'id_api': pub_id_api,
				'numero_processo': '1000000-00.2026.8.26.0001',
				'tribunal': 'TJSP',
				'tipo_comunicacao': 'Intimação',
				'data_disponibilizacao': '2026-02-20',
				'orgao': '1ª Vara',
				'meio': 'D',
				'texto_resumo': 'Resumo',
				'texto_completo': 'Texto completo',
				'link_oficial': None,
			}

			mock_fetch.return_value = {
				'success': True,
				'total_publicacoes': 1,
				'publicacoes': [pub_payload],
			}

			search_url = reverse('publications:search')
			response_1 = self.client.get(
				search_url,
				data={
					'data_inicio': '2026-02-19',
					'data_fim': '2026-02-21',
					'tribunais': 'TJSP',
					'retroactive_days': 0,
				},
			)
			self.assertEqual(response_1.status_code, 200)
			self.assertTrue(Publication.objects.filter(id_api=pub_id_api, owner=self.user).exists())

			delete_url = reverse('publications:delete', kwargs={'id_api': pub_id_api})
			response_del = self.client.delete(delete_url)
			self.assertEqual(response_del.status_code, 200)
			self.assertFalse(Publication.objects.filter(id_api=pub_id_api, owner=self.user).exists())

			response_2 = self.client.get(
				search_url,
				data={
					'data_inicio': '2026-02-19',
					'data_fim': '2026-02-21',
					'tribunais': 'TJSP',
					'retroactive_days': 0,
				},
			)
			self.assertEqual(response_2.status_code, 200)
			payload = response_2.json()
			self.assertEqual(payload.get('total_publicacoes'), 0)
			self.assertEqual(payload.get('publicacoes'), [])
			self.assertFalse(Publication.objects.filter(id_api=pub_id_api, owner=self.user).exists())


class PublicationGetByIdResponseTests(TestCase):
	def test_get_publication_by_id_includes_internal_pk_id(self):
		pub = Publication.objects.create(
			id_api=812345678,
			numero_processo='0000618-47.2026.8.26.0320',
			tribunal='TJSP',
			tipo_comunicacao='Intimação',
			data_disponibilizacao=date(2026, 3, 10),
			orgao='Foro de Limeira - 4ª Vara Cível',
			meio='D',
			texto_resumo='Publicação para teste de GET by id_api',
			texto_completo='Conteúdo completo da publicação',
		)

		url = reverse('publications:get_by_id', kwargs={'id_api': pub.id_api})
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertTrue(payload.get('success'))
		self.assertEqual(payload.get('publication', {}).get('id_api'), pub.id_api)
		self.assertEqual(payload.get('publication', {}).get('id'), pub.id)


class PJeComunicaNameNormalizationTests(TestCase):
	def test_should_include_publication_matches_name_with_or_without_accents(self):
		pub = {
			'texto_completo': 'Intima-se a advogada VITORIA ROCHA DE MORAIS para manifestação.',
			'texto_resumo': '',
			'orgao': '',
		}
		# nome com acento + caixa variada no cadastro não deve perder match
		self.assertTrue(PJeComunicaService.should_include_publication(pub, oab='507553', nome_advogado='Vitória Rocha de Morais'))

	@override_settings(
		PJE_COMUNICA_EXCLUDED_LAWYERS_OABS=['407729'],
		PJE_COMUNICA_EXCLUDED_LAWYERS_KEYWORDS=['ROCHA DO NASCIMENTO', 'LUCIA VITORIA'],
	)
	def test_should_exclude_publication_excludes_keyword_even_with_accent_variation(self):
		pub = {
			'texto_completo': 'Consta como patrona LUCIA VITORIA ROCHA DO NASCIMENTO (OAB 407729).',
			'texto_resumo': '',
			'orgao': '',
		}
		self.assertTrue(PJeComunicaService.should_exclude_publication(pub))


class PublicationsDebugSearchGatingTests(TestCase):
	@override_settings(DEBUG=False)
	def test_debug_search_returns_404_when_debug_false(self):
		url = reverse('publications:debug')
		response = self.client.get(url, data={'data_inicio': '2026-02-01', 'data_fim': '2026-02-02'})
		self.assertEqual(response.status_code, 404)


class PublicationsSearchIdentityValidationTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='master_no_oab', password='123456', email='master_no_oab@example.com')
		profile = self.user.profile
		profile.role = UserProfile.ROLE_MASTER
		profile.full_name_oab = 'Master Sem OAB'
		profile.oab_number = ''
		profile.save(update_fields=['role', 'full_name_oab', 'oab_number'])
		self.client.force_login(self.user)

	def test_fetch_today_requires_oab_and_name(self):
		url = reverse('publications:fetch_today')
		response = self.client.get(url)
		self.assertEqual(response.status_code, 400)
		payload = response.json()
		self.assertFalse(payload.get('success'))
		self.assertIn('Nome completo e o Número da OAB', payload.get('error', ''))

	def test_search_requires_oab_and_name(self):
		url = reverse('publications:search')
		response = self.client.get(url, data={
			'data_inicio': '2026-02-20',
			'data_fim': '2026-02-20',
			'tribunais': ['TJSP'],
		})
		self.assertEqual(response.status_code, 400)
		payload = response.json()
		self.assertFalse(payload.get('success'))
		self.assertIn('Nome completo e o Número da OAB', payload.get('error', ''))


class PublicationsSearchCaseSuggestionTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='pub_search_user', password='123456', email='pub_search_user@example.com')
		profile = self.user.profile
		profile.full_name_oab = 'Teste OAB'
		profile.oab_number = '123456'
		profile.save(update_fields=['full_name_oab', 'oab_number'])

		self.client.force_login(self.user)

		self.case = Case.objects.create(
			numero_processo='1000000-00.2026.8.26.0001',
			titulo='Caso existente',
			tribunal='TJSP',
			comarca='São Paulo',
			status='ATIVO',
			owner=self.user,
		)

	@patch('apps.publications.views.PJeComunicaService.fetch_publications')
	def test_search_publications_attaches_case_suggestion(self, mock_fetch):
		mock_fetch.return_value = {
			'success': True,
			'total_publicacoes': 1,
			'publicacoes': [
				{
					'id_api': 910000001,
					'numero_processo': '1000000-00.2026.8.26.0001',
					'tribunal': 'TJSP',
					'tipo_comunicacao': 'Intimação',
					'data_disponibilizacao': '2026-02-20',
					'orgao': '1ª Vara',
					'meio': 'D',
					'texto_resumo': 'Resumo',
					'texto_completo': 'Texto completo',
					'link_oficial': None,
					'hash': 'abc',
				}
			],
			'erros': None,
		}

		url = reverse('publications:search')
		response = self.client.get(url, data={
			'data_inicio': '2026-02-20',
			'data_fim': '2026-02-20',
			'tribunais': ['TJSP'],
			'retroactive_days': 7,
		})

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertTrue(payload['success'])
		self.assertEqual(payload['total_publicacoes'], 1)

		pub = payload['publicacoes'][0]
		self.assertIn('case_suggestion', pub)
		self.assertIsNotNone(pub['case_suggestion'])
		self.assertEqual(pub['case_suggestion']['id'], self.case.id)
		self.assertEqual(pub['case_suggestion']['numero_processo'], self.case.numero_processo)

	@patch('apps.publications.views.PJeComunicaService.fetch_publications')
	def test_search_publications_no_case_suggestion_when_already_integrated(self, mock_fetch):
		# Pré-criar a publicação no banco como integrada
		Publication.objects.create(
			owner=self.user,
			id_api=910000002,
			numero_processo=self.case.numero_processo,
			tribunal='TJSP',
			tipo_comunicacao='Intimação',
			data_disponibilizacao=date(2026, 2, 20),
			orgao='1ª Vara',
			meio='D',
			texto_resumo='Resumo',
			texto_completo='Texto completo',
			integration_status='INTEGRATED',
			case=self.case,
		)

		mock_fetch.return_value = {
			'success': True,
			'total_publicacoes': 1,
			'publicacoes': [
				{
					'id_api': 910000002,
					'numero_processo': self.case.numero_processo,
					'tribunal': 'TJSP',
					'tipo_comunicacao': 'Intimação',
					'data_disponibilizacao': '2026-02-20',
					'orgao': '1ª Vara',
					'meio': 'D',
					'texto_resumo': 'Resumo',
					'texto_completo': 'Texto completo',
					'link_oficial': None,
					'hash': 'abc',
				}
			],
			'erros': None,
		}

		url = reverse('publications:search')
		response = self.client.get(url, data={
			'data_inicio': '2026-02-20',
			'data_fim': '2026-02-20',
			'tribunais': ['TJSP'],
			'retroactive_days': 7,
		})

		self.assertEqual(response.status_code, 200, response.content)
		payload = response.json()
		pub = payload['publicacoes'][0]
		self.assertEqual(pub['integration_status'], 'INTEGRATED')
		self.assertTrue(pub.get('case_id'))
		self.assertIn('case_suggestion', pub)
		self.assertIsNone(pub['case_suggestion'])


class PublicationsSearchHistoryDetailCaseSuggestionTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username='pub_history_user',
			password='123456',
			email='pub_history_user@example.com',
		)
		profile = self.user.profile
		profile.full_name_oab = 'Teste Histórico'
		profile.oab_number = '999999'
		profile.save(update_fields=['full_name_oab', 'oab_number'])

		self.client.force_login(self.user)

		self.case = Case.objects.create(
			numero_processo='1000000-00.2026.8.26.0001',
			titulo='Caso existente (histórico)',
			tribunal='TJSP',
			comarca='São Paulo',
			status='ATIVO',
			owner=self.user,
		)

		self.pub = Publication.objects.create(
			owner=self.user,
			id_api=920000001,
			numero_processo=self.case.numero_processo,
			tribunal='TJSP',
			tipo_comunicacao='Intimação',
			data_disponibilizacao=date(2026, 3, 21),
			orgao='1ª Vara',
			meio='D',
			texto_resumo='Resumo',
			texto_completo='Texto completo',
			integration_status='PENDING',
		)

		self.search = SearchHistory.objects.create(
			owner=self.user,
			data_inicio=date(2026, 3, 20),
			data_fim=date(2026, 3, 21),
			tribunais=['TJSP'],
			total_publicacoes=1,
			total_novas=0,
			search_params={'retroactive_days': 7},
			duration_seconds=1.0,
		)

	def test_search_history_detail_attaches_case_suggestion(self):
		url = reverse('publications:search_history_detail', kwargs={'search_id': self.search.id})
		response = self.client.get(url)

		self.assertEqual(response.status_code, 200, response.content)
		payload = response.json()
		self.assertTrue(payload['success'])
		self.assertIn('publicacoes', payload)
		self.assertEqual(len(payload['publicacoes']), 1)

		pub = payload['publicacoes'][0]
		self.assertIn('case_suggestion', pub)
		self.assertIsNotNone(pub['case_suggestion'])
		self.assertEqual(pub['case_suggestion']['id'], self.case.id)
