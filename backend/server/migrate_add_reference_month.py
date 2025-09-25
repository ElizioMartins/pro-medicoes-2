"""
Script de migração para adicionar o campo reference_month na tabela readings
"""
import sqlite3
from datetime import datetime
import os

def migrate_database():
    # Caminho do banco de dados
    db_path = os.path.join(os.path.dirname(__file__), 'medicoes.db')
    
    if not os.path.exists(db_path):
        print(f"Banco de dados não encontrado em: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(readings)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'reference_month' in columns:
            print("Coluna 'reference_month' já existe na tabela 'readings'")
            return
        
        print("Adicionando coluna 'reference_month' à tabela 'readings'...")
        
        # Adicionar a coluna reference_month
        cursor.execute("""
            ALTER TABLE readings 
            ADD COLUMN reference_month TEXT
        """)
        
        # Atualizar registros existentes com base na data
        print("Atualizando registros existentes com mês de referência baseado na data...")
        cursor.execute("""
            UPDATE readings 
            SET reference_month = strftime('%Y-%m', date)
            WHERE reference_month IS NULL
        """)
        
        # Tornar a coluna obrigatória (SQLite não suporta NOT NULL em ALTER TABLE)
        # Então vamos criar uma nova tabela e copiar os dados
        print("Recriando tabela com constraint NOT NULL...")
        
        # Criar nova tabela
        cursor.execute("""
            CREATE TABLE readings_new (
                id INTEGER PRIMARY KEY,
                meter_id INTEGER NOT NULL,
                current_reading TEXT,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                reference_month TEXT NOT NULL,
                registered_by INTEGER,
                status TEXT DEFAULT 'PENDING',
                inaccessible_reason TEXT,
                observations TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE CASCADE,
                FOREIGN KEY (registered_by) REFERENCES users(id)
            )
        """)
        
        # Copiar dados com valores padrão para reference_month onde necessário
        cursor.execute("""
            INSERT INTO readings_new 
            SELECT 
                id, meter_id, current_reading, date, 
                COALESCE(reference_month, strftime('%Y-%m', COALESCE(date, datetime('now')))) as reference_month,
                registered_by, status, inaccessible_reason, observations, created_at, updated_at
            FROM readings
        """)
        
        # Remover tabela antiga e renomear nova
        cursor.execute("DROP TABLE readings")
        cursor.execute("ALTER TABLE readings_new RENAME TO readings")
        
        # Recriar índices se necessário
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_readings_meter_id ON readings(meter_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_readings_reference_month ON readings(reference_month)")
        
        conn.commit()
        print("Migração concluída com sucesso!")
        
        # Verificar quantos registros foram atualizados
        cursor.execute("SELECT COUNT(*) FROM readings WHERE reference_month IS NOT NULL")
        count = cursor.fetchone()[0]
        print(f"Total de {count} registros atualizados com mês de referência")
        
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()