"""
Script simplificado para atualizar o campo last_reading de todas as unidades
"""
import sqlite3
import os

def update_last_reading_direct():
    """Atualiza o last_reading diretamente no banco SQLite"""
    
    # Caminho para o banco de dados
    db_path = "medicoes.db"
    
    if not os.path.exists(db_path):
        print(f"Banco de dados não encontrado em: {db_path}")
        return
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Query para atualizar last_reading de cada unidade
        update_query = """
        UPDATE units 
        SET last_reading = (
            SELECT MAX(readings.date)
            FROM readings 
            JOIN meters ON readings.meter_id = meters.id
            WHERE meters.unit_id = units.id
        )
        WHERE id IN (
            SELECT DISTINCT units.id
            FROM units
            JOIN meters ON units.id = meters.unit_id
            JOIN readings ON meters.id = readings.meter_id
        )
        """
        
        # Executar a atualização
        cursor.execute(update_query)
        updated_rows = cursor.rowcount
        
        # Query para definir NULL para unidades sem leituras
        null_query = """
        UPDATE units 
        SET last_reading = NULL
        WHERE id NOT IN (
            SELECT DISTINCT units.id
            FROM units
            JOIN meters ON units.id = meters.unit_id
            JOIN readings ON meters.id = readings.meter_id
        )
        """
        
        cursor.execute(null_query)
        null_rows = cursor.rowcount
        
        # Confirmar mudanças
        conn.commit()
        
        # Verificar resultado
        cursor.execute("SELECT COUNT(*) FROM units")
        total_units = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM units WHERE last_reading IS NOT NULL")
        units_with_readings = cursor.fetchone()[0]
        
        print("Atualização concluída!")
        print(f"Total de unidades: {total_units}")
        print(f"Unidades com leituras atualizadas: {units_with_readings}")
        print(f"Unidades sem leituras (NULL): {total_units - units_with_readings}")
        
        # Mostrar algumas unidades como exemplo
        cursor.execute("""
        SELECT u.number, u.last_reading, COUNT(r.id) as total_readings
        FROM units u
        LEFT JOIN meters m ON u.id = m.unit_id
        LEFT JOIN readings r ON m.id = r.meter_id
        GROUP BY u.id
        LIMIT 10
        """)
        
        print("\nExemplos de unidades:")
        for row in cursor.fetchall():
            number, last_reading, total_readings = row
            print(f"Unidade {number}: Última leitura = {last_reading}, Total leituras = {total_readings}")
        
    except Exception as e:
        print(f"Erro durante a atualização: {str(e)}")
        
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    update_last_reading_direct()