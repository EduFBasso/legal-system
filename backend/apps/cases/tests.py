"""
Unit tests for Cases app
"""
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta
from apps.contacts.models import Contact
from apps.cases.models import (
    Case,
    CaseParty,
    CaseRepresentation,
    CaseLink,
    CaseMovement,
    CasePrazo,
    CaseTask,
    Payment,
    Expense,
    CaseTituloOption,
    CaseRepresentationTypeOption,
)


class CaseModelTest(TestCase):
    """Test Case model"""
    
    def setUp(self):
        """Set up test data"""
        self.contact = Contact.objects.create(
            name='João Silva',
            person_type='PF',
        )
        
        self.case_data = {
            'numero_processo': '0000001-23.2024.8.26.0100',
            'titulo': 'Ação de Cobrança',
            'tribunal': 'TJSP',
            'status': 'ATIVO',
            'data_distribuicao': timezone.now().date() - timedelta(days=30),
        }
    
    def test_create_case(self):
        """Test creating a case"""
        case = Case.objects.create(**self.case_data)
        self.assertEqual(case.numero_processo, '0000001-23.2024.8.26.0100')
        self.assertEqual(case.titulo, 'Ação de Cobrança')
        self.assertEqual(case.tribunal, 'TJSP')
    
    def test_numero_processo_unformatted_auto_populated(self):
        """Test that numero_processo_unformatted is auto-populated on save"""
        case = Case.objects.create(**self.case_data)
        self.assertEqual(case.numero_processo_unformatted, '00000012320248260100')
    
    def test_numero_processo_formatted_property(self):
        """Test the formatted process number property"""
        case = Case.objects.create(**self.case_data)
        self.assertEqual(case.numero_processo_formatted, '0000001-23.2024.8.26.0100')
    
    def test_dias_sem_movimentacao(self):
        """Test calculation of days without activity"""
        case = Case.objects.create(**self.case_data)
        case.data_ultima_movimentacao = timezone.now().date() - timedelta(days=15)
        case.save()
        self.assertEqual(case.dias_sem_movimentacao, 15)
    
    def test_dias_sem_movimentacao_no_activity(self):
        """Test days without activity when no data_ultima_movimentacao"""
        case = Case.objects.create(**self.case_data)
        case.data_ultima_movimentacao = None
        case.save()
        # Should return None when no data_ultima_movimentacao
        self.assertIsNone(case.dias_sem_movimentacao)
    
    def test_esta_ativo_property_true(self):
        """Test esta_ativo property when case is active"""
        case = Case.objects.create(**self.case_data)
        case.data_ultima_movimentacao = timezone.now().date() - timedelta(days=30)
        case.save()
        self.assertTrue(case.esta_ativo)
    
    def test_esta_ativo_property_false(self):
        """Test esta_ativo property when case is inactive"""
        case = Case.objects.create(**self.case_data)
        case.data_ultima_movimentacao = timezone.now().date() - timedelta(days=100)
        case.save()
        self.assertFalse(case.esta_ativo)
    
    def test_atualizar_status_automatico_ativo(self):
        """Test auto-status update to ATIVO"""
        case = Case.objects.create(**self.case_data)
        case.auto_status = True
        case.data_ultima_movimentacao = timezone.now().date() - timedelta(days=50)
        case.save()
        case.atualizar_status_automatico()
        case.refresh_from_db()
        self.assertEqual(case.status, 'ATIVO')
    
    def test_atualizar_status_automatico_inativo(self):
        """Test auto-status update to INATIVO"""
        case = Case.objects.create(**self.case_data)
        case.auto_status = True
        case.data_ultima_movimentacao = timezone.now().date() - timedelta(days=100)
        case.save()
        case.atualizar_status_automatico()
        case.refresh_from_db()
        self.assertEqual(case.status, 'INATIVO')
    
    def test_financial_valor_causa(self):
        """Test valor_causa field"""
        from decimal import Decimal
        case = Case.objects.create(**self.case_data)
        case.valor_causa = Decimal('50000.00')
        case.save()
        case.refresh_from_db()
        self.assertEqual(case.valor_causa, Decimal('50000.00'))
    
    def test_financial_participation_type_nullable(self):
        """Test that participation_type can be null (fix for checkbox uncheck bug)"""
        case = Case.objects.create(**self.case_data)
        case.participation_type = None
        case.save()
        case.refresh_from_db()
        self.assertIsNone(case.participation_type)
    
    def test_financial_participation_percentage(self):
        """Test participation with percentage"""
        from decimal import Decimal
        case = Case.objects.create(**self.case_data)
        case.participation_type = 'percentage'
        case.participation_percentage = Decimal('30.00')
        case.valor_causa = Decimal('100000.00')
        case.save()
        case.refresh_from_db()
        self.assertEqual(case.participation_type, 'percentage')
        self.assertEqual(case.participation_percentage, Decimal('30.00'))
    
    def test_financial_participation_fixed_value(self):
        """Test participation with fixed value"""
        from decimal import Decimal
        case = Case.objects.create(**self.case_data)
        case.participation_type = 'fixed'
        case.participation_fixed_value = Decimal('15000.00')
        case.save()
        case.refresh_from_db()
        self.assertEqual(case.participation_type, 'fixed')
        self.assertEqual(case.participation_fixed_value, Decimal('15000.00'))
    
    def test_financial_attorney_fees(self):
        """Test attorney fees (honorários) fields"""
        from decimal import Decimal
        case = Case.objects.create(**self.case_data)
        case.attorney_fee_amount = Decimal('5000.00')
        case.attorney_fee_installments = 3
        case.payment_conditional = True
        case.save()
        case.refresh_from_db()
        self.assertEqual(case.attorney_fee_amount, Decimal('5000.00'))
        self.assertEqual(case.attorney_fee_installments, 3)
        self.assertTrue(case.payment_conditional)
    
    def test_financial_payment_terms(self):
        """Test payment terms field"""
        case = Case.objects.create(**self.case_data)
        case.payment_terms = '3 parcelas mensais de R$ 5.000,00'
        case.save()
        case.refresh_from_db()
        self.assertEqual(case.payment_terms, '3 parcelas mensais de R$ 5.000,00')

    def test_case_principal_derivado_valid(self):
        """Processo pode apontar para um principal com vinculo_tipo."""
        principal = Case.objects.create(**self.case_data)

        derived = Case.objects.create(
            numero_processo='0000009-23.2024.8.26.0100',
            titulo='Derivado',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date() - timedelta(days=10),
            case_principal=principal,
            vinculo_tipo='DERIVADO',
        )

        self.assertEqual(derived.case_principal_id, principal.id)
        self.assertEqual(derived.vinculo_tipo, 'DERIVADO')

    def test_case_principal_requires_vinculo_tipo(self):
        principal = Case.objects.create(**self.case_data)

        derived = Case(
            numero_processo='0000010-23.2024.8.26.0100',
            titulo='Derivado',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date() - timedelta(days=10),
            case_principal=principal,
            vinculo_tipo='',
        )

        with self.assertRaises(ValidationError):
            derived.clean()

    def test_case_principal_cannot_be_self(self):
        case = Case.objects.create(**self.case_data)
        case.case_principal = case
        case.vinculo_tipo = 'DERIVADO'

        with self.assertRaises(ValidationError):
            case.clean()

    def test_case_principal_cannot_create_cycle(self):
        case_a = Case.objects.create(**self.case_data)
        case_b = Case.objects.create(
            numero_processo='0000011-23.2024.8.26.0100',
            titulo='B',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date() - timedelta(days=5),
            case_principal=case_a,
            vinculo_tipo='DERIVADO',
        )

        case_a.case_principal = case_b
        case_a.vinculo_tipo = 'DERIVADO'

        with self.assertRaises(ValidationError):
            case_a.clean()

    def test_str_representation(self):
        """Test string representation"""
        case = Case.objects.create(**self.case_data)
        expected = '0000001-23.2024.8.26.0100 - Ação de Cobrança'
        self.assertEqual(str(case), expected)

    def test_str_representation_no_numero_processo(self):
        """Test string representation without numero_processo"""
        data = self.case_data.copy()
        data['numero_processo'] = ''
        data['titulo'] = ''
        case = Case.objects.create(**data)
        self.assertEqual(str(case), '')


class CaseLinkModelTest(TestCase):
    def setUp(self):
        self.case_a = Case.objects.create(
            numero_processo='0000100-23.2024.8.26.0100',
            titulo='A',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
        self.case_b = Case.objects.create(
            numero_processo='0000101-23.2024.8.26.0100',
            titulo='B',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )

    def test_case_link_no_self_link(self):
        link = CaseLink(from_case=self.case_a, to_case=self.case_a, link_type='DERIVADO')
        with self.assertRaises(ValidationError):
            link.clean()

    def test_case_link_cycle_prevention(self):
        CaseLink.objects.create(from_case=self.case_a, to_case=self.case_b, link_type='DERIVADO')
        reverse = CaseLink(from_case=self.case_b, to_case=self.case_a, link_type='DERIVADO')
        with self.assertRaises(ValidationError):
            reverse.clean()


class CasePartyModelTest(TestCase):
    """Test CaseParty model"""
    
    def setUp(self):
        """Set up test data"""
        self.contact1 = Contact.objects.create(
            name='João Cliente',
            person_type='PF',
        )
        self.contact2 = Contact.objects.create(
            name='Maria Silva',
            person_type='PF',
        )
        self.case = Case.objects.create(
            numero_processo='0000001-23.2024.8.26.0100',
            titulo='Ação Teste',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
    
    def test_create_case_party(self):
        """Test creating a case party relationship"""
        party = CaseParty.objects.create(
            case=self.case,
            contact=self.contact1,
            role='CLIENTE',
            observacoes='Cliente principal'
        )
        self.assertEqual(party.case, self.case)
        self.assertEqual(party.contact, self.contact1)
        self.assertEqual(party.role, 'CLIENTE')
    
    def test_unique_together_constraint(self):
        """Test that case+contact combination is unique"""
        CaseParty.objects.create(
            case=self.case,
            contact=self.contact1,
            role='CLIENTE',
        )
        
        # Try to create duplicate
        with self.assertRaises(Exception):
            CaseParty.objects.create(
                case=self.case,
                contact=self.contact1,
                role='AUTOR',
            )
    
    def test_multiple_parties_same_case(self):
        """Test adding multiple parties to same case"""
        party1 = CaseParty.objects.create(
            case=self.case,
            contact=self.contact1,
            role='CLIENTE',
        )
        party2 = CaseParty.objects.create(
            case=self.case,
            contact=self.contact2,
            role='REU',
        )
        
        self.assertEqual(self.case.clients.count(), 2)
        self.assertIn(self.contact1, self.case.clients.all())
        self.assertIn(self.contact2, self.case.clients.all())
    
    def test_str_representation(self):
        """Test string representation"""
        party = CaseParty.objects.create(
            case=self.case,
            contact=self.contact1,
            role='CLIENTE',
        )
        expected = f'{self.contact1.name} - Cliente ({self.case.numero_processo})'
        self.assertEqual(str(party), expected)

    def test_caseparty_client_syncs_case_shortcut_fields(self):
        """is_client=True deve sincronizar cliente_principal/cliente_posicao no Case"""
        CaseParty.objects.create(
            case=self.case,
            contact=self.contact1,
            role='AUTOR',
            is_client=True,
        )

        self.case.refresh_from_db()
        self.assertEqual(self.case.cliente_principal_id, self.contact1.id)
        self.assertEqual(self.case.cliente_posicao, 'AUTOR')

    def test_caseparty_client_delete_clears_case_shortcut_fields(self):
        """Ao remover parte cliente, campos-atalho do Case devem ser limpos"""
        party = CaseParty.objects.create(
            case=self.case,
            contact=self.contact1,
            role='AUTOR',
            is_client=True,
        )

        party.delete()
        self.case.refresh_from_db()

        self.assertIsNone(self.case.cliente_principal)
        self.assertEqual(self.case.cliente_posicao, '')

    def test_caseparty_only_one_client_per_case(self):
        """Banco deve impedir mais de um is_client=True para o mesmo processo"""
        CaseParty.objects.create(
            case=self.case,
            contact=self.contact1,
            role='AUTOR',
            is_client=True,
        )

        with self.assertRaises(IntegrityError):
            CaseParty.objects.create(
                case=self.case,
                contact=self.contact2,
                role='REU',
                is_client=True,
            )


class CaseAPITest(APITestCase):
    """Test Case API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.contact = Contact.objects.create(
            name='João Silva',
            person_type='PF',
        )
        
        self.case1 = Case.objects.create(
            numero_processo='0000001-23.2024.8.26.0100',
            titulo='Caso 1',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date() - timedelta(days=30),
        )
        
        self.case2 = Case.objects.create(
            numero_processo='0000002-23.2024.8.26.0100',
            titulo='Caso 2',
            tribunal='STF',
            status='INATIVO',
            data_distribuicao=timezone.now().date() - timedelta(days=60),
        )
    
    def test_list_cases(self):
        """Test listing cases"""
        response = self.client.get('/api/cases/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_cases_includes_parties_summary_contact_id_and_role(self):
        """Listagem deve incluir contact_id/role em parties_summary para suportar navegação Contato↔Processo no frontend."""
        CaseParty.objects.create(
            case=self.case1,
            contact=self.contact,
            role='AUTOR',
            is_client=True,
        )

        response = self.client.get('/api/cases/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        case1_payload = next((item for item in response.data if item.get('id') == self.case1.id), None)
        self.assertIsNotNone(case1_payload)

        parties_summary = case1_payload.get('parties_summary')
        self.assertIsInstance(parties_summary, list)
        self.assertGreaterEqual(len(parties_summary), 1)

        party = parties_summary[0]
        self.assertIn('contact_id', party)
        self.assertEqual(party['contact_id'], self.contact.id)
        self.assertIn('role', party)
        self.assertEqual(party['role'], 'AUTOR')
    
    def test_retrieve_case(self):
        """Test retrieving a single case"""
        response = self.client.get(f'/api/cases/{self.case1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['titulo'], 'Caso 1')
        self.assertEqual(response.data['numero_processo'], '0000001-23.2024.8.26.0100')
    
    def test_create_case(self):
        """Test creating a case"""
        data = {
            'numero_processo': '0000003-23.2024.8.26.0100',
            'titulo': 'Novo Caso',
            'tribunal': 'TJSP',
            'status': 'ATIVO',
            'data_distribuicao': timezone.now().date().isoformat(),
        }
        response = self.client.post('/api/cases/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Case.objects.count(), 3)
        self.assertEqual(response.data['titulo'], 'Novo Caso')

    def test_create_case_derivado_requires_vinculo_tipo(self):
        data = {
            'numero_processo': '0000012-23.2024.8.26.0100',
            'titulo': 'Caso Derivado Sem Tipo',
            'tribunal': 'TJSP',
            'status': 'ATIVO',
            'data_distribuicao': timezone.now().date().isoformat(),
            'case_principal': self.case1.id,
        }
        response = self.client.post('/api/cases/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vinculo_tipo', response.data)

    def test_create_case_derivado_ok(self):
        data = {
            'numero_processo': '0000013-23.2024.8.26.0100',
            'titulo': 'Caso Derivado',
            'tribunal': 'TJSP',
            'status': 'ATIVO',
            'data_distribuicao': timezone.now().date().isoformat(),
            'case_principal': self.case1.id,
            'vinculo_tipo': 'DERIVADO',
        }
        response = self.client.post('/api/cases/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['case_principal'], self.case1.id)
        self.assertEqual(response.data['vinculo_tipo'], 'DERIVADO')

    def test_create_case_link_ok(self):
        from_case = Case.objects.create(
            owner=self.user,
            numero_processo='0000200-23.2024.8.26.0100',
            titulo='Origem',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
        to_case = Case.objects.create(
            owner=self.user,
            numero_processo='0000201-23.2024.8.26.0100',
            titulo='Destino',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )

        payload = {
            'from_case': from_case.id,
            'to_case': to_case.id,
            'link_type': 'APENSO',
            'notes': 'Apenso para controle interno',
        }
        response = self.client.post('/api/case-links/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['from_case'], from_case.id)
        self.assertEqual(response.data['to_case'], to_case.id)
        self.assertEqual(response.data['link_type'], 'APENSO')

    def test_create_case_link_blocks_cycle(self):
        a = Case.objects.create(
            owner=self.user,
            numero_processo='0000202-23.2024.8.26.0100',
            titulo='A',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
        b = Case.objects.create(
            owner=self.user,
            numero_processo='0000203-23.2024.8.26.0100',
            titulo='B',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )

        first = self.client.post(
            '/api/case-links/',
            {'from_case': a.id, 'to_case': b.id, 'link_type': 'DERIVADO'},
            format='json',
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        cycle = self.client.post(
            '/api/case-links/',
            {'from_case': b.id, 'to_case': a.id, 'link_type': 'DERIVADO'},
            format='json',
        )
        self.assertEqual(cycle.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_case_invalid_cnj_format(self):
        """Test creating a case with invalid CNJ format"""
        data = {
            'numero_processo': '123456',  # Invalid format
            'titulo': 'Caso Inválido',
            'tribunal': 'TJSP',
            'status': 'ATIVO',
            'data_distribuicao': timezone.now().date().isoformat(),
        }
        response = self.client.post('/api/cases/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('numero_processo', response.data)
    
    def test_update_case(self):
        """Test updating a case"""
        data = {'titulo': 'Caso Atualizado'}
        response = self.client.patch(
            f'/api/cases/{self.case1.id}/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.case1.refresh_from_db()
        self.assertEqual(self.case1.titulo, 'Caso Atualizado')
    
    def test_delete_case(self):
        """Test deleting a case (soft delete)"""
        response = self.client.delete(f'/api/cases/{self.case1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Soft delete keeps the case in database but marks as deleted
        self.case1.refresh_from_db()
        self.assertTrue(self.case1.deleted)
        self.assertIsNotNone(self.case1.deleted_at)
    
    def test_update_financial_data(self):
        """Test updating financial data of a case"""
        data = {
            'valor_causa': '75000.00',
            'participation_type': 'percentage',
            'participation_percentage': '25.00',
        }
        response = self.client.patch(
            f'/api/cases/{self.case1.id}/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.case1.refresh_from_db()
        from decimal import Decimal
        self.assertEqual(self.case1.valor_causa, Decimal('75000.00'))
        self.assertEqual(self.case1.participation_type, 'percentage')
        self.assertEqual(self.case1.participation_percentage, Decimal('25.00'))
    
    def test_update_participation_to_null(self):
        """Test updating participation_type to null (uncheck bug fix)"""
        # First set a participation type
        self.case1.participation_type = 'percentage'
        self.case1.participation_percentage = 30
        self.case1.save()
        
        # Now clear it (simulating uncheck all checkboxes)
        data = {
            'participation_type': None,
            'participation_percentage': None,
            'participation_fixed_value': None,
        }
        response = self.client.patch(
            f'/api/cases/{self.case1.id}/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.case1.refresh_from_db()
        self.assertIsNone(self.case1.participation_type)
    
    def test_create_case_with_financial_data(self):
        """Test creating a case with financial data"""
        data = {
            'numero_processo': '0000005-23.2024.8.26.0100',
            'titulo': 'Caso com Dados Financeiros',
            'tribunal': 'TJSP',
            'status': 'ATIVO',
            'data_distribuicao': timezone.now().date().isoformat(),
            'valor_causa': '100000.00',
            'participation_type': 'percentage',
            'participation_percentage': '30.00',
            'attorney_fee_amount': '5000.00',
            'attorney_fee_installments': 3,
            'payment_terms': 'Pagamento após sentença',
        }
        response = self.client.post('/api/cases/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        case = Case.objects.get(id=response.data['id'])
        from decimal import Decimal
        self.assertEqual(case.valor_causa, Decimal('100000.00'))
        self.assertEqual(case.participation_type, 'percentage')
        self.assertEqual(case.participation_percentage, Decimal('30.00'))
        self.assertEqual(case.attorney_fee_amount, Decimal('5000.00'))
        self.assertEqual(case.attorney_fee_installments, 3)
    
    def test_update_status_action(self):
        """Test update_status custom action"""
        self.case1.auto_status = True  # Enable auto status
        self.case1.data_ultima_movimentacao = timezone.now().date() - timedelta(days=100)
        self.case1.save()
        
        response = self.client.post(f'/api/cases/{self.case1.id}/update_status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.case1.refresh_from_db()
        # After update_status, the status field should be 'INATIVO'
        self.assertEqual(self.case1.status, 'INATIVO')
    
    def test_stats_action(self):
        """Test stats custom action"""
        response = self.client.get('/api/cases/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('by_status', response.data)
        self.assertIn('by_tribunal', response.data)
        self.assertEqual(response.data['total'], 2)
    
    def test_filter_by_tribunal(self):
        """Test filtering cases by tribunal"""
        response = self.client.get('/api/cases/?tribunal=TJSP')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['tribunal'], 'TJSP')
    
    def test_filter_by_status(self):
        """Test filtering cases by status"""
        response = self.client.get('/api/cases/?status=ATIVO')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'ATIVO')

    def test_filter_by_cliente_principal(self):
        """Test filtering cases by cliente_principal"""
        self.case1.cliente_principal = self.contact
        self.case1.cliente_posicao = 'AUTOR'
        self.case1.save()

        response = self.client.get(f'/api/cases/?cliente_principal={self.contact.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.case1.id)
    
    def test_search_by_numero_processo(self):
        """Test searching cases by process number"""
        response = self.client.get('/api/cases/?search=0000001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn('0000001', response.data[0]['numero_processo'])
    
    def test_search_by_titulo(self):
        """Test searching cases by title"""
        response = self.client.get('/api/cases/?search=Caso 1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Search is partial, so "Caso 1" might match both "Caso 1" and "Caso 2"
        self.assertGreaterEqual(len(response.data), 1)
        # Verify that at least one result has the expected title
        titulos = [case['titulo'] for case in response.data]
        self.assertIn('Caso 1', titulos)


class CasePartyAPITest(APITestCase):
    """Test CaseParty API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.contact = Contact.objects.create(
            name='João Silva',
            person_type='PF',
        )
        
        self.case = Case.objects.create(
            numero_processo='0000001-23.2024.8.26.0100',
            titulo='Caso Teste',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )

        self.case2 = Case.objects.create(
            numero_processo='0000002-23.2024.8.26.0100',
            titulo='Caso Teste 2',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
    
    def test_create_case_party(self):
        """Test creating a case party"""
        data = {
            'case': self.case.id,
            'contact': self.contact.id,
            'role': 'CLIENTE',
            'observacoes': 'Cliente principal',
        }
        response = self.client.post('/api/case-parties/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CaseParty.objects.count(), 1)
    
    def test_list_case_parties(self):
        """Test listing case parties"""
        CaseParty.objects.create(
            case=self.case,
            contact=self.contact,
            role='CLIENTE',
        )
        response = self.client.get('/api/case-parties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_filter_by_case(self):
        """Test filtering case parties by case"""
        CaseParty.objects.create(
            case=self.case,
            contact=self.contact,
            role='CLIENTE',
        )
        response = self.client.get(f'/api/case-parties/?case={self.case.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_filter_by_role(self):
        """Test filtering case parties by role"""
        CaseParty.objects.create(
            case=self.case,
            contact=self.contact,
            role='CLIENTE',
        )
        response = self.client.get('/api/case-parties/?role=CLIENTE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_api_blocks_second_client_for_same_case(self):
        """API deve bloquear 2 clientes no mesmo processo"""
        contact2 = Contact.objects.create(name='Maria Souza', person_type='PF')

        first_payload = {
            'case': self.case.id,
            'contact': self.contact.id,
            'role': 'CLIENTE',
            'is_client': True,
        }
        second_payload = {
            'case': self.case.id,
            'contact': contact2.id,
            'role': 'CLIENTE',
            'is_client': True,
        }

        response1 = self.client.post('/api/case-parties/', first_payload, format='json')
        response2 = self.client.post('/api/case-parties/', second_payload, format='json')

        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('is_client', response2.data)

    def test_titulo_options_returns_defaults_when_empty(self):
        """Mesmo com base “zerada”, o dropdown de TÍTULO não pode ficar vazio."""
        Case.objects.all().delete()
        CaseTituloOption.objects.all().delete()

        response = self.client.get('/api/cases/titulo-options/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)

        # Deve conter pelo menos um item padrão conhecido.
        self.assertTrue(
            any(
                item.get('label') == 'Ação de Cobrança' and item.get('editable') is False
                for item in response.data
            )
        )

    def test_titulo_options_post_default_does_not_persist(self):
        """Criar uma opção que já existe na lista fixa deve apenas retornar o default."""
        Case.objects.all().delete()
        CaseTituloOption.objects.all().delete()

        response = self.client.post('/api/cases/titulo-options/', {'label': 'Ação de Cobrança'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('label'), 'Ação de Cobrança')
        self.assertEqual(response.data.get('editable'), False)
        self.assertEqual(CaseTituloOption.objects.count(), 0)

    def test_representation_type_options_returns_defaults_when_empty(self):
        """Mesmo com base “zerada”, o dropdown de tipo de representação não pode ficar vazio."""
        CaseRepresentationTypeOption.objects.all().delete()

        response = self.client.get('/api/cases/representation-type-options/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)

        self.assertTrue(
            any(
                item.get('label') == 'Procurador' and item.get('editable') is False
                for item in response.data
            )
        )

    def test_representation_type_options_post_default_does_not_persist(self):
        """Criar uma opção que já existe na lista fixa deve apenas retornar o default."""
        CaseRepresentationTypeOption.objects.all().delete()

        response = self.client.post(
            '/api/cases/representation-type-options/',
            {'label': 'Procurador'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('label'), 'Procurador')
        self.assertEqual(response.data.get('editable'), False)
        self.assertEqual(CaseRepresentationTypeOption.objects.count(), 0)

    def test_api_allows_same_client_in_multiple_cases(self):
        """Mesmo contato pode ser cliente em processos diferentes"""
        payload_case1 = {
            'case': self.case.id,
            'contact': self.contact.id,
            'role': 'CLIENTE',
            'is_client': True,
        }
        payload_case2 = {
            'case': self.case2.id,
            'contact': self.contact.id,
            'role': 'CLIENTE',
            'is_client': True,
        }

        response1 = self.client.post('/api/case-parties/', payload_case1, format='json')
        response2 = self.client.post('/api/case-parties/', payload_case2, format='json')

        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

    def test_api_requires_representative_when_represented(self):
        """Se is_represented=True, deve exigir representative_contact e representation_type."""
        payload_missing_rep = {
            'case': self.case.id,
            'contact': self.contact.id,
            'role': 'CLIENTE',
            'is_client': True,
            'is_represented': True,
            'representation_type': 'Procurador',
        }
        resp = self.client.post('/api/case-parties/', payload_missing_rep, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('representative_contact', resp.data)

        representative = Contact.objects.create(name='Representante', person_type='PF')
        payload_missing_type = {
            'case': self.case.id,
            'contact': self.contact.id,
            'role': 'CLIENTE',
            'is_client': True,
            'is_represented': True,
            'representative_contact': representative.id,
        }
        resp2 = self.client.post('/api/case-parties/', payload_missing_type, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('representation_type', resp2.data)

    def test_api_creates_representation_when_represented_client(self):
        representative = Contact.objects.create(name='Representante', person_type='PF')

        payload = {
            'case': self.case.id,
            'contact': self.contact.id,
            'role': 'CLIENTE',
            'is_client': True,
            'is_represented': True,
            'representative_contact': representative.id,
            'representation_type': 'Procurador',
        }

        response = self.client.post('/api/case-parties/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CaseParty.objects.count(), 1)
        self.assertEqual(CaseRepresentation.objects.count(), 1)

        rep = CaseRepresentation.objects.first()
        self.assertEqual(rep.case_id, self.case.id)
        self.assertEqual(rep.represented_contact_id, self.contact.id)
        self.assertEqual(rep.representative_contact_id, representative.id)
        self.assertEqual(rep.representation_type, 'Procurador')

    def test_api_allows_representation_for_non_client_party(self):
        """Representação é permitida mesmo quando is_client=False."""
        representative = Contact.objects.create(name='Representante', person_type='PF')

        payload = {
            'case': self.case.id,
            'contact': self.contact.id,
            'role': 'AUTOR',
            'is_client': False,
            'is_represented': True,
            'representative_contact': representative.id,
            'representation_type': 'Procurador',
        }

        response = self.client.post('/api/case-parties/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CaseParty.objects.count(), 1)
        self.assertEqual(CaseRepresentation.objects.count(), 1)

        rep = CaseRepresentation.objects.first()
        self.assertEqual(rep.case_id, self.case.id)
        self.assertEqual(rep.represented_contact_id, self.contact.id)
        self.assertEqual(rep.representative_contact_id, representative.id)
        self.assertEqual(rep.representation_type, 'Procurador')


class CaseMovementModelTest(TestCase):
    """Test CaseMovement model"""
    
    def setUp(self):
        """Set up test data"""
        self.case = Case.objects.create(
            numero_processo='0000001-23.2024.8.26.0100',
            titulo='Ação de Cobrança',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date() - timedelta(days=30),
        )
    
    def test_create_movement(self):
        """Test creating a case movement"""
        movement = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Despacho sobre petição',
            descricao='Despacho determinando juntada de documentos',
            origem='MANUAL',
        )
        self.assertEqual(movement.case, self.case)
        self.assertEqual(movement.tipo, 'DESPACHO')
        self.assertEqual(movement.titulo, 'Despacho sobre petição')
    
    def test_auto_calculate_data_limite_prazo(self):
        """Test automatic calculation of data_limite_prazo"""
        movement = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Despacho com prazo',
            prazo=10,  # 10 dias
            origem='MANUAL',
        )
        expected_deadline = timezone.now().date() + timedelta(days=10)
        self.assertEqual(movement.data_limite_prazo, expected_deadline)
    
    def test_update_case_ultima_movimentacao_on_create(self):
        """Test that creating a movement updates case's data_ultima_movimentacao"""
        movement_date = timezone.now().date()
        movement = CaseMovement.objects.create(
            case=self.case,
            data=movement_date,
            tipo='DESPACHO',
            titulo='Nova movimentação',
            origem='MANUAL',
        )
        self.case.refresh_from_db()
        self.assertEqual(self.case.data_ultima_movimentacao, movement_date)
    
    def test_update_case_ultima_movimentacao_on_delete(self):
        """Test that deleting a movement recalculates case's data_ultima_movimentacao"""
        # Create two movements
        older_date = timezone.now().date() - timedelta(days=5)
        newer_date = timezone.now().date()
        
        older_movement = CaseMovement.objects.create(
            case=self.case,
            data=older_date,
            tipo='DESPACHO',
            titulo='Movimento antigo',
            origem='MANUAL',
        )
        
        newer_movement = CaseMovement.objects.create(
            case=self.case,
            data=newer_date,
            tipo='DECISAO',
            titulo='Movimento recente',
            origem='MANUAL',
        )
        
        # Verify case has the newer movement
        self.case.refresh_from_db()
        self.assertEqual(self.case.data_ultima_movimentacao, newer_date)
        
        # Delete the newer movement
        newer_movement.delete()
        
        # Verify case now has the older movement
        self.case.refresh_from_db()
        self.assertEqual(self.case.data_ultima_movimentacao, older_date)
    
    def test_movement_without_prazo(self):
        """Test creating movement without prazo"""
        movement = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Despacho sem prazo',
            prazo=None,
            origem='MANUAL',
        )
        self.assertIsNone(movement.data_limite_prazo)


class CaseMovementAPITest(APITestCase):
    """Test CaseMovement API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.case = Case.objects.create(
            numero_processo='0000001-23.2024.8.26.0100',
            titulo='Ação de Cobrança',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date() - timedelta(days=30),
        )
    
    def test_create_movement(self):
        """Test creating a case movement via API"""
        data = {
            'case': self.case.id,
            'data': timezone.now().date().isoformat(),
            'tipo': 'DESPACHO',
            'titulo': 'Despacho de teste',
            'descricao': 'Descrição do despacho',
            'origem': 'MANUAL',
        }
        response = self.client.post('/api/case-movements/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CaseMovement.objects.count(), 1)
        
        movement = CaseMovement.objects.first()
        self.assertEqual(movement.titulo, 'Despacho de teste')
    
    def test_create_movement_with_prazo(self):
        """Test creating a movement with prazo"""
        data = {
            'case': self.case.id,
            'data': timezone.now().date().isoformat(),
            'tipo': 'DESPACHO',
            'titulo': 'Despacho com prazo',
            'prazo': 15,
            'origem': 'MANUAL',
        }
        response = self.client.post('/api/case-movements/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        movement = CaseMovement.objects.first()
        expected_deadline = timezone.now().date() + timedelta(days=15)
        self.assertEqual(movement.data_limite_prazo, expected_deadline)
    
    def test_reject_future_date(self):
        """Test that API rejects movements with future dates"""
        future_date = timezone.now().date() + timedelta(days=1)
        data = {
            'case': self.case.id,
            'data': future_date.isoformat(),
            'tipo': 'DESPACHO',
            'titulo': 'Movimento futuro',
            'origem': 'MANUAL',
        }
        response = self.client.post('/api/case-movements/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data', response.data)
        self.assertEqual(CaseMovement.objects.count(), 0)
    
    def test_list_movements_by_case(self):
        """Test filtering movements by case"""
        CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Movimento 1',
            origem='MANUAL',
        )
        CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date() - timedelta(days=1),
            tipo='DECISAO',
            titulo='Movimento 2',
            origem='MANUAL',
        )
        
        response = self.client.get(f'/api/case-movements/?case_id={self.case.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_update_movement(self):
        """Test updating a movement"""
        movement = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Título original',
            origem='MANUAL',
        )
        
        data = {
            'case': self.case.id,
            'data': timezone.now().date().isoformat(),
            'tipo': 'DECISAO',
            'titulo': 'Título atualizado',
            'origem': 'MANUAL',
        }
        response = self.client.put(f'/api/case-movements/{movement.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        movement.refresh_from_db()
        self.assertEqual(movement.titulo, 'Título atualizado')
        self.assertEqual(movement.tipo, 'DECISAO')
    
    def test_delete_movement(self):
        """Test deleting a movement"""
        movement = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Movimento para deletar',
            origem='MANUAL',
        )
        
        response = self.client.delete(f'/api/case-movements/{movement.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CaseMovement.objects.count(), 0)


class DeadlineNotificationTest(APITestCase):
    """Test deadline notification creation"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.case = Case.objects.create(
            numero_processo='0000001-23.2024.8.26.0100',
            titulo='Ação de Cobrança',
            tribunal='TJSP',
            status='ATIVO',
        )
    
    def test_check_deadlines_endpoint(self):
        """Test the check_deadlines endpoint"""
        # Create a movement with deadline today (urgent)
        CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date() - timedelta(days=5),
            tipo='DESPACHO',
            titulo='Despacho com prazo urgente',
            prazo=5,  # Expires today
            origem='MANUAL',
        )
        
        # Create a movement with deadline in 2 days (medium)
        CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date() - timedelta(days=3),
            tipo='DESPACHO',
            titulo='Despacho com prazo próximo',
            prazo=5,  # Expires in 2 days
            origem='MANUAL',
        )
        
        response = self.client.post('/api/notifications/check_deadlines/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['checked'], 2)
        self.assertGreaterEqual(response.data['created'], 0)
    
    def test_no_duplicate_notifications(self):
        """Test that duplicate notifications are not created"""
        movement = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date() - timedelta(days=5),
            tipo='DESPACHO',
            titulo='Despacho com prazo',
            prazo=5,
            origem='MANUAL',
        )
        
        # First call - should create notification
        response1 = self.client.post('/api/notifications/check_deadlines/')
        created1 = response1.data['created']
        
        # Second call - should skip (already exists)
        response2 = self.client.post('/api/notifications/check_deadlines/')
        created2 = response2.data['created']
        skipped2 = response2.data['skipped']
        
        # Second call should create 0 and skip the existing one
        self.assertEqual(created2, 0)
        self.assertGreater(skipped2, 0)
    
    def test_deadline_priority_classification(self):
        """Test that deadlines are classified correctly (15/7/3 pattern)"""
        from apps.notifications.models import Notification
        
        # Create movements with different deadlines
        # Urgentíssimo: 2 days (0-3)
        mov_urgentissimo = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='INTIMACAO',
            titulo='Prazo urgentíssimo',
            prazo=2,
            origem='MANUAL',
        )
        
        # Urgente: 5 days (4-7)
        mov_urgente = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='INTIMACAO',
            titulo='Prazo urgente',
            prazo=5,
            origem='MANUAL',
        )
        
        # Normal: 10 days (8-15)
        mov_normal = CaseMovement.objects.create(
            case=self.case,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Prazo normal',
            prazo=10,
            origem='MANUAL',
        )
        
        # Trigger notification creation
        response = self.client.post('/api/notifications/check_deadlines/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 3)
        
        # Verify priorities
        notif_urgentissimo = Notification.objects.get(metadata__movement_id=mov_urgentissimo.id)
        notif_urgente = Notification.objects.get(metadata__movement_id=mov_urgente.id)
        notif_normal = Notification.objects.get(metadata__movement_id=mov_normal.id)
        
        self.assertEqual(notif_urgentissimo.priority, 'urgent')
        self.assertEqual(notif_urgente.priority, 'high')
        self.assertEqual(notif_normal.priority, 'medium')


class CaseTaskScopeTests(APITestCase):
    """Security/regression tests for CaseTaskViewSet scoping."""

    def setUp(self):
        self.client = APIClient()

        self.user_a = User.objects.create_user(username='task_user_a', password='testpass123')
        self.user_a.profile.role = 'ADVOGADO'
        self.user_a.profile.save()
        self.user_b = User.objects.create_user(username='task_user_b', password='testpass123')
        self.user_b.profile.role = 'ADVOGADO'
        self.user_b.profile.save()
        self.master = User.objects.create_user(username='task_master', password='testpass123')
        self.master.profile.role = 'MASTER'
        self.master.profile.save()

        self.case_a = Case.objects.create(
            numero_processo='0000001-23.2026.8.26.0100',
            titulo='Case A',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
            owner=self.user_a,
        )

        self.task_a = CaseTask.objects.create(
            case=self.case_a,
            titulo='Tarefa do A',
            descricao='Teste de escopo',
        )

    def test_non_master_cannot_use_team_member_id_to_view_other_tasks(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.get(f'/api/case-tasks/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}
        self.assertNotIn(self.task_a.id, returned_ids)

    def test_master_can_scope_tasks_by_team_member_id(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get(f'/api/case-tasks/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}
        self.assertIn(self.task_a.id, returned_ids)


class MasterCaseScopeTests(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.master = User.objects.create_user(username='scope_master', password='testpass123')
        self.master.profile.role = 'MASTER'
        self.master.profile.save()

        self.user_a = User.objects.create_user(username='scope_user_a', password='testpass123')
        self.user_a.profile.role = 'ADVOGADO'
        self.user_a.profile.save()

        self.contact = Contact.objects.create(name='Contato', person_type='PF')

        self.case_master = Case.objects.create(
            numero_processo='0000001-23.2026.8.26.0100',
            titulo='Case Master',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
            owner=self.master,
        )
        self.case_a = Case.objects.create(
            numero_processo='0000002-23.2026.8.26.0100',
            titulo='Case A',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
            owner=self.user_a,
        )
        self.case_ownerless = Case.objects.create(
            numero_processo='0000003-23.2026.8.26.0100',
            titulo='Case Ownerless',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )

        self.party_a = CaseParty.objects.create(case=self.case_a, contact=self.contact, role='AUTOR')
        self.party_master = CaseParty.objects.create(case=self.case_master, contact=self.contact, role='AUTOR')

        self.movement_a = CaseMovement.objects.create(
            case=self.case_a,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Mov A',
            origem='MANUAL',
        )

    def test_master_without_scope_does_not_see_other_users_cases(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get('/api/cases/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.case_master.id, returned_ids)
        self.assertIn(self.case_ownerless.id, returned_ids)
        self.assertNotIn(self.case_a.id, returned_ids)

    def test_master_team_scope_all_sees_team_cases(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get('/api/cases/?team_scope=all')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.case_master.id, returned_ids)
        self.assertIn(self.case_a.id, returned_ids)

    def test_master_team_member_id_scopes_to_member_cases(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get(f'/api/cases/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.case_a.id, returned_ids)
        self.assertNotIn(self.case_master.id, returned_ids)
        self.assertNotIn(self.case_ownerless.id, returned_ids)

    def test_master_without_scope_does_not_see_other_users_case_parties(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get('/api/case-parties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.party_master.id, returned_ids)
        self.assertNotIn(self.party_a.id, returned_ids)

    def test_master_without_scope_does_not_see_other_users_movements(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get('/api/case-movements/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertNotIn(self.movement_a.id, returned_ids)


class PaymentExpenseScopeTests(APITestCase):
    """Security/regression tests for PaymentViewSet and ExpenseViewSet scoping."""

    def setUp(self):
        self.client = APIClient()

        self.master = User.objects.create_user(username='pay_master', password='testpass123')
        self.master.profile.role = 'MASTER'
        self.master.profile.save()

        self.user_a = User.objects.create_user(username='pay_user_a', password='testpass123')
        self.user_a.profile.role = 'ADVOGADO'
        self.user_a.profile.save()

        self.user_b = User.objects.create_user(username='pay_user_b', password='testpass123')
        self.user_b.profile.role = 'ADVOGADO'
        self.user_b.profile.save()

        self.case_master = Case.objects.create(
            numero_processo='0000100-23.2026.8.26.0100',
            titulo='Case Master Pay',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
            owner=self.master,
        )
        self.case_a = Case.objects.create(
            numero_processo='0000101-23.2026.8.26.0100',
            titulo='Case A Pay',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
            owner=self.user_a,
        )
        self.case_ownerless = Case.objects.create(
            numero_processo='0000102-23.2026.8.26.0100',
            titulo='Case Ownerless Pay',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )

        self.payment_master = Payment.objects.create(
            case=self.case_master,
            date=timezone.now().date(),
            description='Payment master',
            value=100,
        )
        self.payment_a = Payment.objects.create(
            case=self.case_a,
            date=timezone.now().date(),
            description='Payment user A',
            value=200,
        )
        self.payment_ownerless = Payment.objects.create(
            case=self.case_ownerless,
            date=timezone.now().date(),
            description='Payment ownerless',
            value=300,
        )

        self.expense_master = Expense.objects.create(
            case=self.case_master,
            date=timezone.now().date(),
            description='Expense master',
            value=10,
        )
        self.expense_a = Expense.objects.create(
            case=self.case_a,
            date=timezone.now().date(),
            description='Expense user A',
            value=20,
        )
        self.expense_ownerless = Expense.objects.create(
            case=self.case_ownerless,
            date=timezone.now().date(),
            description='Expense ownerless',
            value=30,
        )

    def test_non_master_cannot_use_team_member_id_to_view_other_users_payments(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.get(f'/api/payments/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}
        self.assertNotIn(self.payment_a.id, returned_ids)

    def test_master_without_scope_sees_self_and_ownerless_payments_only(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get('/api/payments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.payment_master.id, returned_ids)
        self.assertIn(self.payment_ownerless.id, returned_ids)
        self.assertNotIn(self.payment_a.id, returned_ids)

    def test_master_team_scope_all_sees_team_payments_but_not_ownerless(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get('/api/payments/?team_scope=all')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.payment_master.id, returned_ids)
        self.assertIn(self.payment_a.id, returned_ids)
        self.assertNotIn(self.payment_ownerless.id, returned_ids)

    def test_master_team_member_id_scopes_to_member_payments(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get(f'/api/payments/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.payment_a.id, returned_ids)
        self.assertNotIn(self.payment_master.id, returned_ids)
        self.assertNotIn(self.payment_ownerless.id, returned_ids)

    def test_master_team_scope_all_sees_team_expenses_but_not_ownerless(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get('/api/expenses/?team_scope=all')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.expense_master.id, returned_ids)
        self.assertIn(self.expense_a.id, returned_ids)
        self.assertNotIn(self.expense_ownerless.id, returned_ids)

    def test_non_master_cannot_use_team_member_id_to_view_other_users_expenses(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.get(f'/api/expenses/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}
        self.assertNotIn(self.expense_a.id, returned_ids)

    def test_master_without_scope_sees_self_and_ownerless_expenses_only(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get('/api/expenses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.expense_master.id, returned_ids)
        self.assertIn(self.expense_ownerless.id, returned_ids)
        self.assertNotIn(self.expense_a.id, returned_ids)

    def test_master_team_member_id_scopes_to_member_expenses(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get(f'/api/expenses/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}

        self.assertIn(self.expense_a.id, returned_ids)
        self.assertNotIn(self.expense_master.id, returned_ids)
        self.assertNotIn(self.expense_ownerless.id, returned_ids)


class CasePrazoScopeTests(APITestCase):
    """Security/regression tests for CasePrazoViewSet scoping."""

    def setUp(self):
        self.client = APIClient()

        self.user_a = User.objects.create_user(username='prazo_user_a', password='testpass123')
        self.user_a.profile.role = 'ADVOGADO'
        self.user_a.profile.save()

        self.user_b = User.objects.create_user(username='prazo_user_b', password='testpass123')
        self.user_b.profile.role = 'ADVOGADO'
        self.user_b.profile.save()

        self.master = User.objects.create_user(username='prazo_master', password='testpass123')
        self.master.profile.role = 'MASTER'
        self.master.profile.save()

        self.case_a = Case.objects.create(
            numero_processo='0000201-23.2026.8.26.0100',
            titulo='Case A Prazo',
            tribunal='TJSP',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
            owner=self.user_a,
        )

        self.movement_a = CaseMovement.objects.create(
            case=self.case_a,
            data=timezone.now().date(),
            tipo='DESPACHO',
            titulo='Mov Prazo A',
            origem='MANUAL',
        )

        self.prazo_a = CasePrazo.objects.create(
            movimentacao=self.movement_a,
            prazo_dias=15,
            descricao='Prazo do A',
        )

    def test_non_master_cannot_use_team_member_id_to_view_other_prazos(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.get(f'/api/case-prazos/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}
        self.assertNotIn(self.prazo_a.id, returned_ids)

    def test_master_can_scope_prazos_by_team_member_id(self):
        self.client.force_authenticate(user=self.master)

        response = self.client.get(f'/api/case-prazos/?team_member_id={self.user_a.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item['id'] for item in response.data}
        self.assertIn(self.prazo_a.id, returned_ids)



# Test Summary:
# Test Coverage Summary:
# - Model tests: Case model with financial fields
# - API tests: CRUD operations including financial data
# - CaseMovement Model tests: 5 tests
# - CaseMovement API tests: 7 tests  
# - CaseParty tests: Model and API tests
# - Deadline Notification tests: 3 tests (includes 15/7/3 priority classification)
# - Financial tests: 7 new tests for valor_causa, participation types, honorarios, payment_terms
#
# Changes in this version:
# - Removed soft-delete tests (feature removed from system)
# - Added comprehensive financial module tests
# - Fixed participation_type nullable test (bug fix validation)
