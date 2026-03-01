"""
Script para renomear processos deletados e liberar constraint UNIQUE
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.cases.models import Case
from django.utils import timezone

# Buscar casos deletados com número que pode estar travando
cases = Case.objects.filter(
    deleted=True, 
    numero_processo__contains='0000618-47.2026'
)

if not cases.exists():
    print("❌ Nenhum processo deletado encontrado com esse número")
else:
    for case in cases:
        old_num = case.numero_processo
        
        # Verificar se já tem sufixo _deleted_
        if '_deleted_' in old_num:
            print(f"⏭️  Processo {case.id} já renomeado: {old_num}")
            continue
        
        # Renomear para liberar constraint
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        case.numero_processo = f'{old_num}_deleted_{timestamp}'
        case.save()
        
        print(f"✅ Processo #{case.id} renomeado:")
        print(f"   De: {old_num}")
        print(f"   Para: {case.numero_processo}")

print("\n🎯 Pronto! Agora você pode criar novo processo com o número original.")
