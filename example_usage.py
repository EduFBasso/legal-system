"""
Example usage and testing of CRUD operations
"""

from datetime import date
from src.database import SessionLocal, init_db
from src.crud import ClientCRUD, CaseCRUD, NoticeCRUD
from src.models import ClientType, CaseStatus, CasePriority


def example_usage():
    """Demonstrate CRUD operations"""
    
    # Initialize database
    init_db()
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("SISTEMA JUDICIÁRIO - EXEMPLO DE USO")
        print("=" * 60)
        
        # 1. CREATE CLIENT (Pessoa Física)
        print("\n1. Criando cliente (Pessoa Física)...")
        client1 = ClientCRUD.create(
            db,
            name="João Silva Santos",
            client_type=ClientType.PERSON.value,
            cpf="12345678901",
            rg="1234567",
            profession="Engenheiro",
            email="joao@email.com",
            phone="(11) 98765-4321",
            address="Rua das Flores",
            number="123",
            city="São Paulo",
            state="SP",
            zipcode="01234567"
        )
        print(f"   ✓ Cliente criado: ID={client1.id}, Nome={client1.name}")
        
        # 2. CREATE CLIENT (Pessoa Jurídica)
        print("\n2. Criando cliente (Pessoa Jurídica)...")
        client2 = ClientCRUD.create(
            db,
            name="Empresa XYZ Ltda",
            client_type=ClientType.LEGAL_ENTITY.value,
            cnpj="12345678000190",
            company_name="Empresa XYZ Ltda",
            legal_representative="Maria Santos",
            email="contato@empresa.com",
            phone="(11) 3333-4444",
            address="Av. Paulista",
            number="1000",
            city="São Paulo",
            state="SP"
        )
        print(f"   ✓ Cliente criado: ID={client2.id}, Nome={client2.name}")
        
        # 3. READ CLIENT
        print("\n3. Consultando cliente...")
        retrieved_client = ClientCRUD.read(db, client1.id)
        print(f"   ✓ Cliente: {retrieved_client.name} ({retrieved_client.client_type})")
        
        # 4. UPDATE CLIENT
        print("\n4. Atualizando cliente...")
        updated_client = ClientCRUD.update(db, client1.id, email="joao.novo@email.com")
        print(f"   ✓ Email atualizado: {updated_client.email}")
        
        # 5. CREATE CASE
        print("\n5. Criando processo...")
        case1 = CaseCRUD.create(
            db,
            case_number="0000001-00.2026.8.26.0100",
            client_id=client1.id,
            case_type="Ação Ordinária",
            opposing_party="Réu Desconhecido",
            court="Tribunal de Justiça do Estado de São Paulo",
            legal_area="Cível",
            status=CaseStatus.IN_PROGRESS.value,
            priority=CasePriority.HIGH.value,
            description="Cobrança de dívida de contrato de prestação de serviços",
            filing_date=date(2025, 1, 15),
            deadline=date(2026, 2, 15),
            claim_value="R$ 50.000,00"
        )
        print(f"   ✓ Processo criado: {case1.case_number}")
        
        # 6. CREATE NOTICE
        print("\n6. Criando aviso/prazo...")
        notice1 = NoticeCRUD.create(
            db,
            case_id=case1.id,
            title="Prazo para apresentação de contestação",
            due_date=date(2026, 2, 15),
            description="Prazo legal para o réu apresentar sua defesa"
        )
        print(f"   ✓ Aviso criado: {notice1.title}")
        
        # 7. SEARCH
        print("\n7. Pesquisando clientes...")
        search_results = ClientCRUD.search(db, "João")
        print(f"   ✓ Encontrados {len(search_results)} cliente(s)")
        for client in search_results:
            print(f"      - {client.name}")
        
        # 8. GET CASES BY CLIENT
        print("\n8. Consultando processos do cliente...")
        client_cases = CaseCRUD.read_by_client(db, client1.id)
        print(f"   ✓ Cliente tem {len(client_cases)} processo(s)")
        
        # 9. GET PENDING NOTICES
        print("\n9. Consultando avisos pendentes...")
        pending = NoticeCRUD.read_pending(db)
        print(f"   ✓ {len(pending)} aviso(s) pendente(s)")
        for notice in pending:
            print(f"      - {notice.title} (Vencimento: {notice.due_date})")
        
        # 10. LIST ALL CLIENTS
        print("\n10. Listando todos os clientes...")
        all_clients = ClientCRUD.read_all(db, limit=100)
        print(f"    ✓ Total de {len(all_clients)} cliente(s) no banco")
        
        print("\n" + "=" * 60)
        print("EXEMPLO CONCLUÍDO COM SUCESSO!")
        print("=" * 60)
        
    finally:
        db.close()


if __name__ == "__main__":
    example_usage()
