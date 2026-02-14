"""
Script de teste CRUD para o model Contact.
Execute com: python manage.py shell < este_arquivo.py

Ou copie e cole os comandos no Django shell interativo.
"""

# === IMPORTAR MODEL ===
from apps.contacts.models import Contact

print("🚀 Testando CRUD - Model Contact\n")

# === CREATE (Criar) ===
print("📝 1. CREATE - Criando contatos...")

# Cliente Pessoa Física
cliente_pf = Contact.objects.create(
    contact_type='CLIENT',
    person_type='PF',
    name='João Silva Santos',
    document_number='12345678901',
    email='joao.silva@email.com',
    mobile='(11) 98765-4321',
    phone='(11) 3456-7890',
    zip_code='01310-100',
    street='Avenida Paulista',
    number='1578',
    complement='Sala 1201',
    neighborhood='Bela Vista',
    city='São Paulo',
    state='SP',
    notes='Cliente desde 2020, processos cíveis.',
)
print(f"✅ Criado: {cliente_pf}")
print(f"   - ID: {cliente_pf.id}")
print(f"   - Nome: {cliente_pf.name}")
print(f"   - CPF formatado: {cliente_pf.document_formatted}")
print(f"   - Contato principal: {cliente_pf.primary_contact}")
print(f"   - Tem endereço completo? {cliente_pf.has_complete_address}")
print(f"   - Endereço: {cliente_pf.address_oneline}\n")

# Cliente Pessoa Jurídica (sem endereço completo)
cliente_pj = Contact.objects.create(
    contact_type='CLIENT',
    person_type='PJ',
    name='Tech Solutions LTDA',
    document_number='12345678000199',
    email='contato@techsolutions.com.br',
    phone='(11) 4002-8922',
    city='São Paulo',
    state='SP',
    notes='Cliente corporativo, contratos.',
)
print(f"✅ Criado: {cliente_pj}")
print(f"   - Tem endereço completo? {cliente_pj.has_complete_address}")
print(f"   - CNPJ formatado: {cliente_pj.document_formatted}\n")

# Parte Contrária
parte_contraria = Contact.objects.create(
    contact_type='OPPOSING',
    person_type='PF',
    name='Maria Oliveira Costa',
    document_number='98765432100',
    email='maria.oliveira@email.com',
    mobile='(21) 99876-5432',
    city='Rio de Janeiro',
    state='RJ',
)
print(f"✅ Criado: {parte_contraria}\n")

# Testemunha (sem contatos)
testemunha = Contact.objects.create(
    contact_type='WITNESS',
    person_type='PF',
    name='Carlos Eduardo Mendes',
    city='Curitiba',
    state='PR',
    notes='Testemunha do caso #123',
)
print(f"✅ Criado: {testemunha}")
print(f"   - Tem informações de contato? {testemunha.has_contact_info}\n")

# === READ (Ler/Consultar) ===
print("\n" + "="*60)
print("📖 2. READ - Consultando contatos...")
print("="*60 + "\n")

# Listar todos
all_contacts = Contact.objects.all()
print(f"📊 Total de contatos: {all_contacts.count()}\n")

# Filtrar por tipo
clientes = Contact.objects.filter(contact_type='CLIENT')
print(f"👥 Clientes: {clientes.count()}")
for c in clientes:
    print(f"   - {c.name} ({c.get_person_type_display()})")

# Buscar por nome (case-insensitive)
busca = Contact.objects.filter(name__icontains='silva')
print(f"\n🔍 Busca por 'silva': {busca.count()}")
for c in busca:
    print(f"   - {c.name}")

# Get específico (por ID)
try:
    contato_1 = Contact.objects.get(id=1)
    print(f"\n🎯 Contato ID 1: {contato_1.name}")
except Contact.DoesNotExist:
    print("\n❌ Contato ID 1 não existe")

# Primeiro e último
primeiro = Contact.objects.first()
ultimo = Contact.objects.last()
print(f"\n⬇️ Primeiro cadastrado: {primeiro.name if primeiro else 'Nenhum'}")
print(f"⬆️ Último cadastrado: {ultimo.name if ultimo else 'Nenhum'}")

# Ordenar
ordenados = Contact.objects.order_by('name')
print(f"\n📋 Contatos em ordem alfabética:")
for c in ordenados:
    print(f"   - {c.name}")

# === UPDATE (Atualizar) ===
print("\n" + "="*60)
print("✏️ 3. UPDATE - Atualizando contatos...")
print("="*60 + "\n")

# Atualizar um contato específico
joao = Contact.objects.get(name__icontains='João Silva')
print(f"Antes: {joao.mobile}")
joao.mobile = '(11) 91234-5678'
joao.notes = 'Cliente VIP - atualizado em ' + str(joao.updated_at.date())
joao.save()
print(f"Depois: {joao.mobile}")
print(f"✅ {joao.name} atualizado!\n")

# Update em massa (sem disparar signals)
updated_count = Contact.objects.filter(
    contact_type='CLIENT'
).update(notes='Cliente ativo - atualização em massa')
print(f"✅ {updated_count} clientes atualizados em massa\n")

# === DELETE (Deletar) ===
print("\n" + "="*60)
print("🗑️ 4. DELETE - Deletando contatos...")
print("="*60 + "\n")

print("\n⚠️ Exemplos de DELETE permanente (comentados para segurança):")
print("# Contact.objects.get(id=999).delete()  # Deleta um específico")
print("# Contact.objects.filter(contact_type='WITNESS').delete()  # Deleta testemunhas")
print("# Contact.objects.all().delete()  # PERIGO! Deleta todos")

# === QUERIES AVANÇADAS ===
print("\n" + "="*60)
print("🎯 5. QUERIES AVANÇADAS")
print("="*60 + "\n")

# Q objects (OR queries)
from django.db.models import Q
sp_ou_rj = Contact.objects.filter(Q(state='SP') | Q(state='RJ'))
print(f"📍 Contatos de SP ou RJ: {sp_ou_rj.count()}")

# Aggregate (estatísticas)
from django.db.models import Count
stats = Contact.objects.values('contact_type').annotate(total=Count('id'))
print("\n📊 Estatísticas por tipo:")
for stat in stats:
    print(f"   - {stat['contact_type']}: {stat['total']}")

# Exists (checagem rápida)
tem_pj = Contact.objects.filter(person_type='PJ').exists()
print(f"\n🏢 Existe PJ cadastrada? {tem_pj}")

# Values (apenas campos específicos)
nomes_emails = Contact.objects.values('name', 'email')[:3]
print(f"\n📧 Primeiros 3 contatos (nome + email):")
for item in nomes_emails:
    print(f"   - {item['name']}: {item['email'] or 'Sem email'}")

# === PROPERTIES ===
print("\n" + "="*60)
print("🎨 6. TESTANDO PROPERTIES (mini-cards)")
print("="*60 + "\n")

for contact in Contact.objects.all()[:3]:
    print(f"👤 {contact.name}")
    print(f"   - Tipo: {contact.get_contact_type_display()}")
    print(f"   - Documento: {contact.document_formatted or 'Não informado'}")
    print(f"   - Contato: {contact.primary_contact or 'Não informado'}")
    print(f"   - Tem contatos? {contact.has_contact_info}")
    print(f"   - Endereço completo? {contact.has_complete_address}")
    if contact.has_complete_address:
        print(f"   - Endereço: {contact.address_oneline}")
    print()

# === RESUMO FINAL ===
print("\n" + "="*60)
print("📊jquery RESUMO FINAL")
print("="*60)
print(f"Total de contatos: {Contact.objects.count()}")
print(f"Clientes: {Contact.objects.filter(contact_type='CLIENT').count()}")
print(f"Com email: {Contact.objects.exclude(email='').exclude(email=None).count()}")
print(f"Com endereço completo: {sum(1 for c in Contact.objects.all() if c.has_complete_address)}")
print("\n✅ Teste CRUD concluído com sucesso!")
