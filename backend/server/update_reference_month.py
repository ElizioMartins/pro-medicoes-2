import sqlite3

conn = sqlite3.connect('medicoes.db')
cursor = conn.cursor()

# Verificar registros sem reference_month
cursor.execute('SELECT COUNT(*) FROM readings WHERE reference_month IS NULL')
null_count = cursor.fetchone()[0]
print(f'Registros sem reference_month: {null_count}')

# Atualizar registros
cursor.execute("""
UPDATE readings 
SET reference_month = strftime('%Y-%m', COALESCE(date, datetime('now'))) 
WHERE reference_month IS NULL
""")

conn.commit()
print('Registros atualizados com sucesso')

# Verificar total atualizado
cursor.execute('SELECT COUNT(*) FROM readings WHERE reference_month IS NOT NULL')
total = cursor.fetchone()[0]
print(f'Total de registros com reference_month: {total}')

conn.close()