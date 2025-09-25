"""
Script para atualizar o campo last_reading de todas as unidades
baseado nas leituras existentes dos seus medidores.
"""
import sys
import os

# Adicionar o caminho do server ao PYTHONPATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import func
from dbmodels.database import get_db, engine
from dbmodels.units import Unit
from dbmodels.meters import Meter
from dbmodels.readings import Reading

def update_all_units_last_reading():
    """Atualiza o last_reading de todas as unidades no banco de dados"""
    
    # Criar uma sessão
    db = next(get_db())
    
    try:
        # Buscar todas as unidades
        units = db.query(Unit).all()
        
        print(f"Atualizando {len(units)} unidades...")
        
        updated_count = 0
        
        for unit in units:
            # Buscar a data da última leitura de todos os medidores da unidade
            last_reading = db.query(func.max(Reading.date)).join(Meter).filter(
                Meter.unit_id == unit.id
            ).scalar()
            
            if last_reading:
                unit.last_reading = last_reading
                updated_count += 1
                print(f"Unidade {unit.number} - Última leitura: {last_reading}")
            else:
                unit.last_reading = None
                print(f"Unidade {unit.number} - Nenhuma leitura encontrada")
        
        # Salvar todas as mudanças
        db.commit()
        
        print(f"\nAtualização concluída!")
        print(f"Total de unidades processadas: {len(units)}")
        print(f"Unidades com leituras: {updated_count}")
        print(f"Unidades sem leituras: {len(units) - updated_count}")
        
    except Exception as e:
        db.rollback()
        print(f"Erro durante a atualização: {str(e)}")
        
    finally:
        db.close()

if __name__ == "__main__":
    update_all_units_last_reading()