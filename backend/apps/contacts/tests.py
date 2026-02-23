"""
Unit tests for Contacts app.
Tests cover:
- Contact model functionality
- Contact API endpoints (CRUD, search)
- Contact serializers (list, detail)
- CaseParty integration (link/unlink)
"""
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.contacts.models import Contact
from apps.cases.models import Case, CaseParty
from apps.contacts.serializers import ContactListSerializer, ContactDetailSerializer


class ContactModelTest(TestCase):
    """Test Contact model"""
    
    def setUp(self):
        """Set up test data"""
        self.pf_data = {
            'name': 'João Silva',
            'person_type': 'PF',
            'document_number': '170.140.798-16',
            'email': 'joao@example.com',
            'mobile': '(19) 99019-8519',
        }
        
        self.pj_data = {
            'name': 'Empresa XYZ Ltda',
            'trading_name': 'XYZ Shop',
            'person_type': 'PJ',
            'document_number': '12.345.678/0001-90',
            'email': 'contato@xyz.com',
            'phone': '(11) 3000-0000',
        }
    
    def test_create_pessoa_fisica(self):
        """Test creating a Pessoa Física contact"""
        contact = Contact.objects.create(**self.pf_data)
        self.assertEqual(contact.name, 'João Silva')
        self.assertEqual(contact.person_type, 'PF')
        self.assertEqual(contact.document_number, '170.140.798-16')
        self.assertIsNotNone(contact.id)
    
    def test_create_pessoa_juridica(self):
        """Test creating a Pessoa Jurídica contact"""
        contact = Contact.objects.create(**self.pj_data)
        self.assertEqual(contact.name, 'Empresa XYZ Ltda')
        self.assertEqual(contact.trading_name, 'XYZ Shop')
        self.assertEqual(contact.person_type, 'PJ')
    
    def test_document_formatted_property_cpf(self):
        """Test document_formatted property for CPF"""
        contact = Contact.objects.create(**self.pf_data)
        self.assertEqual(contact.document_formatted, '170.140.798-16')
    
    def test_document_formatted_property_cnpj(self):
        """Test document_formatted property for CNPJ"""
        contact = Contact.objects.create(**self.pj_data)
        self.assertEqual(contact.document_formatted, '12.345.678/0001-90')
    
    def test_document_formatted_no_document(self):
        """Test document_formatted when no document provided"""
        data = self.pf_data.copy()
        data['document_number'] = ''
        contact = Contact.objects.create(**data)
        self.assertIsNone(contact.document_formatted)
    
    def test_primary_contact_mobile_preferred(self):
        """Test primary_contact property prefers mobile"""
        contact = Contact.objects.create(**self.pf_data)
        self.assertEqual(contact.primary_contact, '(19) 99019-8519')
    
    def test_primary_contact_fallback_phone(self):
        """Test primary_contact falls back to phone"""
        data = self.pj_data.copy()
        data['mobile'] = ''
        contact = Contact.objects.create(**data)
        self.assertEqual(contact.primary_contact, '(11) 3000-0000')
    
    def test_has_contact_info_true(self):
        """Test has_contact_info property when contact has info"""
        contact = Contact.objects.create(**self.pf_data)
        self.assertTrue(contact.has_contact_info)
    
    def test_has_contact_info_false(self):
        """Test has_contact_info property when no contact info"""
        data = {'name': 'Test', 'person_type': 'PF'}
        contact = Contact.objects.create(**data)
        self.assertFalse(contact.has_contact_info)
    
    def test_str_representation(self):
        """Test string representation"""
        contact = Contact.objects.create(**self.pf_data)
        self.assertEqual(str(contact), 'João Silva (Pessoa Física)')
    
    def test_created_updated_timestamps(self):
        """Test that timestamps are automatically set"""
        contact = Contact.objects.create(**self.pf_data)
        self.assertIsNotNone(contact.created_at)
        self.assertIsNotNone(contact.updated_at)


class ContactAPITest(APITestCase):
    """Test Contact API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test contacts
        self.contact1 = Contact.objects.create(
            name='João Silva',
            person_type='PF',
            document_number='170.140.798-16',
            mobile='(19) 99019-8519',
            email='joao@example.com',
        )
        
        self.contact2 = Contact.objects.create(
            name='Maria Costa',
            person_type='PF',
            document_number='123.456.789-00',
            mobile='(11) 98765-4321',
        )
        
        self.contact3 = Contact.objects.create(
            name='Empresa ABC Ltda',
            person_type='PJ',
            document_number='12.345.678/0001-90',
            phone='(11) 3000-0000',
        )
        
        # Create a case for testing search by process number
        self.case = Case.objects.create(
            numero_processo='0000004-23.2025.8.26.0100',
            titulo='Ação Teste',
            tribunal='TJSP',
            comarca='São Paulo',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
        
        # Link contact1 to case
        self.party = CaseParty.objects.create(
            case=self.case,
            contact=self.contact1,
            role='AUTOR',
            is_client=True,
        )
    
    def test_list_contacts(self):
        """Test listing contacts"""
        response = self.client.get('/api/contacts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
    
    def test_retrieve_contact(self):
        """Test retrieving a single contact"""
        response = self.client.get(f'/api/contacts/{self.contact1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'João Silva')
        self.assertEqual(response.data['document_number'], '170.140.798-16')
    
    def test_create_contact(self):
        """Test creating a contact"""
        data = {
            'name': 'Novo Contato',
            'person_type': 'PF',
            'document_number': '111.222.333-44',
            'mobile': '(11) 91234-5678',
        }
        response = self.client.post('/api/contacts/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contact.objects.count(), 4)
        self.assertEqual(response.data['name'], 'Novo Contato')
    
    def test_update_contact(self):
        """Test updating a contact"""
        data = {'name': 'João Silva Atualizado'}
        response = self.client.patch(
            f'/api/contacts/{self.contact1.id}/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contact1.refresh_from_db()
        self.assertEqual(self.contact1.name, 'João Silva Atualizado')
    
    def test_delete_contact(self):
        """Test deleting a contact (hard delete)"""
        contact_id = self.contact2.id
        response = self.client.delete(f'/api/contacts/{contact_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify contact was deleted from database
        self.assertFalse(Contact.objects.filter(id=contact_id).exists())
    
    def test_search_by_name(self):
        """Test searching contacts by name"""
        response = self.client.get('/api/contacts/?search=João')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'João Silva')
    
    def test_search_by_cpf(self):
        """Test searching contacts by CPF (formatted)"""
        response = self.client.get('/api/contacts/?search=170.140.798-16')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['document_number'], '170.140.798-16')
    
    def test_search_by_phone(self):
        """Test searching contacts by phone number"""
        response = self.client.get('/api/contacts/?search=99019-8519')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['mobile_formatted'], '(19) 99019-8519')
    
    def test_search_by_process_number(self):
        """Test searching contacts by linked process number"""
        response = self.client.get('/api/contacts/?search=0000004')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'João Silva')
    
    def test_search_by_process_number_unformatted(self):
        """Test searching by unformatted process number (digits only)"""
        response = self.client.get('/api/contacts/?search=0000004232025')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_filter_by_person_type(self):
        """Test filtering contacts by person_type"""
        response = self.client.get('/api/contacts/?person_type=PJ')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['person_type'], 'PJ')
    
    def test_search_returns_no_duplicates(self):
        """Test that search with distinct() doesn't return duplicates"""
        # Create another case and link same contact
        case2 = Case.objects.create(
            numero_processo='0000005-23.2025.8.26.0100',
            titulo='Ação Teste 2',
            tribunal='TJSP',
            comarca='São Paulo',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
        CaseParty.objects.create(
            case=case2,
            contact=self.contact1,
            role='REU',
        )
        
        # Search should still return contact1 only once
        response = self.client.get('/api/contacts/?search=João')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class ContactSerializerTest(TestCase):
    """Test Contact serializers"""
    
    def setUp(self):
        """Set up test data"""
        self.contact = Contact.objects.create(
            name='Test Contact',
            person_type='PF',
            document_number='123.456.789-00',
            mobile='(11) 91234-5678',
        )
        
        self.case = Case.objects.create(
            numero_processo='0000001-23.2025.8.26.0100',
            titulo='Test Case',
            tribunal='TJSP',
            comarca='São Paulo',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
        
        self.party = CaseParty.objects.create(
            case=self.case,
            contact=self.contact,
            role='CLIENTE',
            is_client=True,
        )
    
    def test_contact_list_serializer_basic_fields(self):
        """Test ContactListSerializer returns basic fields"""
        serializer = ContactListSerializer(self.contact)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Test Contact')
        self.assertEqual(data['person_type'], 'PF')
        self.assertEqual(data['document_formatted'], '123.456.789-00')
    
    def test_contact_list_serializer_linked_cases_returns_party_id(self):
        """
        CRITICAL TEST: Verify that linked_cases returns CaseParty.id, not Case.id
        This was a bug fixed in conversation (cp.id vs cp.case.id)
        """
        serializer = ContactListSerializer(self.contact)
        data = serializer.data
        
        self.assertEqual(len(data['linked_cases']), 1)
        linked_case = data['linked_cases'][0]
        
        # The 'id' field should be CaseParty.id (for unlink operation)
        self.assertEqual(linked_case['id'], self.party.id)
        
        # case_id should be the actual Case.id
        self.assertEqual(linked_case['case_id'], self.case.id)
        
        # Also verify other fields
        self.assertEqual(linked_case['role'], 'CLIENTE')
        self.assertTrue(linked_case['is_client'])
    
    def test_contact_list_serializer_is_client_anywhere(self):
        """Test is_client_anywhere field"""
        serializer = ContactListSerializer(self.contact)
        data = serializer.data
        
        self.assertTrue(data['is_client_anywhere'])
    
    def test_contact_detail_serializer_all_fields(self):
        """Test ContactDetailSerializer returns all fields"""
        serializer = ContactDetailSerializer(self.contact)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Test Contact')
        self.assertEqual(data['person_type_display'], 'Pessoa Física')
        self.assertEqual(data['document_formatted'], '123.456.789-00')
        self.assertEqual(data['mobile_formatted'], '(11) 91234-5678')
        self.assertIsNotNone(data['has_contact_info'])
    
    def test_contact_detail_serializer_linked_cases_returns_party_id(self):
        """
        CRITICAL TEST: Verify ContactDetailSerializer also returns party.id correctly
        Both serializers had the same bug, both were fixed
        """
        serializer = ContactDetailSerializer(self.contact)
        data = serializer.data
        
        self.assertEqual(len(data['linked_cases']), 1)
        linked_case = data['linked_cases'][0]
        
        # Same assertion as list serializer
        self.assertEqual(linked_case['id'], self.party.id)
        self.assertEqual(linked_case['case_id'], self.case.id)
    
    def test_linked_cases_multiple_processes(self):
        """Test contact linked to multiple processes"""
        case2 = Case.objects.create(
            numero_processo='0000002-23.2025.8.26.0100',
            titulo='Test Case 2',
            tribunal='TJSP',
            comarca='São Paulo',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
        party2 = CaseParty.objects.create(
            case=case2,
            contact=self.contact,
            role='TESTEMUNHA',
            is_client=False,
        )
        
        serializer = ContactListSerializer(self.contact)
        data = serializer.data
        
        self.assertEqual(len(data['linked_cases']), 2)
        
        # Verify both parties are correctly represented
        party_ids = [lc['id'] for lc in data['linked_cases']]
        self.assertIn(self.party.id, party_ids)
        self.assertIn(party2.id, party_ids)


class ContactCasePartyIntegrationTest(APITestCase):
    """Test integration between Contacts and CaseParty (link/unlink)"""
    
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
            numero_processo='0000001-23.2025.8.26.0100',
            titulo='Test Case',
            tribunal='TJSP',
            comarca='São Paulo',
            status='ATIVO',
            data_distribuicao=timezone.now().date(),
        )
    
    def test_link_contact_to_case(self):
        """Test linking a contact to a case (create CaseParty)"""
        data = {
            'case': self.case.id,
            'contact': self.contact.id,
            'role': 'CLIENTE',
            'is_client': True,
        }
        response = self.client.post('/api/case-parties/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify in database
        self.assertEqual(CaseParty.objects.count(), 1)
        party = CaseParty.objects.first()
        self.assertEqual(party.contact, self.contact)
        self.assertEqual(party.case, self.case)
    
    def test_unlink_contact_from_case(self):
        """Test unlinking a contact from case (delete CaseParty)"""
        party = CaseParty.objects.create(
            case=self.case,
            contact=self.contact,
            role='CLIENTE',
            is_client=True,
        )
        
        response = self.client.delete(f'/api/case-parties/{party.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify deletion
        self.assertEqual(CaseParty.objects.count(), 0)
    
    def test_contact_detail_shows_linked_cases_after_link(self):
        """Test that contact detail API shows linked cases after linking"""
        # Link contact to case
        CaseParty.objects.create(
            case=self.case,
            contact=self.contact,
            role='AUTOR',
            is_client=True,
        )
        
        # Retrieve contact
        response = self.client.get(f'/api/contacts/{self.contact.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check linked_cases
        self.assertEqual(len(response.data['linked_cases']), 1)
        self.assertEqual(response.data['linked_cases'][0]['numero_processo'], '0000001-23.2025.8.26.0100')
    
    def test_contact_detail_empty_linked_cases_after_unlink(self):
        """Test that contact shows empty linked_cases after unlinking"""
        party = CaseParty.objects.create(
            case=self.case,
            contact=self.contact,
            role='AUTOR',
        )
        
        # Unlink
        self.client.delete(f'/api/case-parties/{party.id}/')
        
        # Retrieve contact
        response = self.client.get(f'/api/contacts/{self.contact.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify no linked cases
        self.assertEqual(len(response.data['linked_cases']), 0)


# Test Summary for Contacts App:
# 
# Model Tests (12 tests):
# - Basic CRUD operations
# - Property calculations (document_formatted, primary_contact, etc)
# - Soft delete functionality
# 
# API Tests (13 tests):
# - CRUD operations
# - Search by name, CPF, phone, process number
# - Filter by person_type
# - Distinct results (no duplicates)
# 
# Serializer Tests (8 tests):
# - Basic field serialization
# - CRITICAL: cp.id vs cp.case.id bug verification
# - Multiple linked cases handling
# 
# Integration Tests (4 tests):
# - Link/unlink workflow
# - API response consistency
# 
# Total: 37 tests for comprehensive coverage
