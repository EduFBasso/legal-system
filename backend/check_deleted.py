import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Publicações deletadas
print("\n" + "=" * 100)
print("PUBLICAÇÕES DELETADAS (soft delete)")
print("=" * 100)
cursor.execute('''
    SELECT id_api, numero_processo, deleted, deleted_at, deleted_reason 
    FROM publications_publication 
    WHERE deleted = 1
''')
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"\nID API: {row[0]}")
        print(f"Processo: {row[1]}")
        print(f"Deleted: {row[2]}")
        print(f"Data/Hora: {row[3]}")
        print(f"Motivo: {row[4]}")
        print("-" * 100)
else:
    print("\nNenhuma publicação deletada encontrada.")

# Contadores
cursor.execute('SELECT COUNT(*) FROM publications_publication WHERE deleted = 1')
total_deleted = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM publications_publication WHERE deleted = 0')
total_active = cursor.fetchone()[0]

print("\n" + "=" * 100)
print("RESUMO")
print("=" * 100)
print(f"Total publicações ATIVAS: {total_active}")
print(f"Total publicações DELETADAS: {total_deleted}")
print(f"Total GERAL: {total_active + total_deleted}")
print("=" * 100 + "\n")

conn.close()
