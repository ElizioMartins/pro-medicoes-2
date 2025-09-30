"""
Script para popular o banco de dados com dados de teste para relatórios.
"""
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from dbmodels.database import engine, get_db, Base
from dbmodels.condominiums import Condominium
from dbmodels.units import Unit
from dbmodels.meters import Meter
from dbmodels.measurement_types import MeasurementType
from dbmodels.readings import Reading, ReadingStatus
import random

def create_test_data():
    """
    Cria dados de teste para relatórios.
    """
    print("🔄 Criando dados de teste para relatórios...")
    
    db = next(get_db())
    
    try:
        # Buscar o tipo de medição de água
        water_type = db.query(MeasurementType).filter(MeasurementType.name == "Água").first()
        if not water_type:
            print("❌ Tipo de medição 'Água' não encontrado. Execute init_db.py primeiro.")
            return
        
        # Buscar ou criar condomínio de teste
        test_condo = db.query(Condominium).filter(Condominium.name == "Residencial Parque das Flores").first()
        if not test_condo:
            test_condo = Condominium(
                name="Residencial Parque das Flores",
                address="Av. das Flores, 456 - Jardim Primavera",
                cnpj="98.765.432/0001-12",
                manager="Maria Santos",
                phone="(11) 9876-5432",
                email="contato@parquedasflores.com.br",
                units_count=0,
                meters_count=0,
                readings_count=0,
                reports_count=0
            )
            db.add(test_condo)
            db.commit()
            print("✅ Condomínio 'Residencial Parque das Flores' criado")
        
        # Criar unidades se não existirem
        units_data = [
            {"number": "101", "resident": "João Silva"},
            {"number": "102", "resident": "Maria Santos"},
            {"number": "103", "resident": "Pedro Costa"},
            {"number": "201", "resident": "Ana Oliveira"},
            {"number": "202", "resident": "Carlos Lima"},
            {"number": "203", "resident": "Lucia Ferreira"},
            {"number": "301", "resident": "Ricardo Alves"},
            {"number": "302", "resident": "Sandra Moura"}
        ]
        
        created_units = []
        for unit_data in units_data:
            existing_unit = db.query(Unit).filter(
                Unit.condominium_id == test_condo.id,
                Unit.number == unit_data["number"]
            ).first()
            
            if not existing_unit:
                unit = Unit(
                    number=unit_data["number"],
                    condominium_id=test_condo.id,
                    floor=int(unit_data["number"][0]),
                    block="A",
                    area=85.5,
                    bedrooms=3,
                    bathrooms=2,
                    active=True
                )
                db.add(unit)
                created_units.append(unit)
                print(f"✅ Unidade {unit_data['number']} criada")
        
        db.commit()
        
        # Criar medidores para cada unidade
        all_units = db.query(Unit).filter(Unit.condominium_id == test_condo.id).all()
        
        for i, unit in enumerate(all_units):
            existing_meter = db.query(Meter).filter(
                Meter.unit_id == unit.id,
                Meter.measurement_type_id == water_type.id
            ).first()
            
            if not existing_meter:
                meter = Meter(
                    serial_number=f"WAT{test_condo.id:03d}{unit.id:03d}",
                    unit_id=unit.id,
                    measurement_type_id=water_type.id,
                    location="Área de serviço",
                    installation_date=datetime.now() - timedelta(days=365),
                    last_reading=None,
                    active=True
                )
                db.add(meter)
                print(f"✅ Medidor para unidade {unit.number} criado")
        
        db.commit()
        
        # Criar leituras para os últimos 3 meses
        current_date = datetime.now()
        meters = db.query(Meter).join(Unit).filter(
            Unit.condominium_id == test_condo.id,
            Meter.measurement_type_id == water_type.id
        ).all()
        
        # Gerar leituras para 3 meses
        for month_offset in range(3, 0, -1):  # 3, 2, 1 (meses atrás)
            target_date = current_date - timedelta(days=30 * month_offset)
            reference_month = target_date.strftime("%Y-%m")
            
            print(f"🔄 Gerando leituras para {reference_month}...")
            
            for meter in meters:
                # Verificar se já existe leitura para este mês
                existing_reading = db.query(Reading).filter(
                    Reading.meter_id == meter.id,
                    Reading.reference_month == reference_month
                ).first()
                
                if not existing_reading:
                    # Pegar leitura anterior para calcular consumo realista
                    prev_month = (target_date - timedelta(days=32)).strftime("%Y-%m")
                    prev_reading = db.query(Reading).filter(
                        Reading.meter_id == meter.id,
                        Reading.reference_month == prev_month
                    ).first()
                    
                    # Valor base inicial ou baseado na leitura anterior
                    if prev_reading:
                        base_value = float(prev_reading.current_reading) if prev_reading.current_reading else 1000
                    else:
                        base_value = 1000 + (meter.id * 100)  # Valor inicial diferente por medidor
                    
                    # Consumo mensal realista (entre 15 e 60 m³)
                    monthly_consumption = random.uniform(15, 60)
                    current_reading_value = base_value + monthly_consumption
                    
                    reading = Reading(
                        meter_id=meter.id,
                        current_reading=f"{current_reading_value:.2f}",
                        reference_month=reference_month,
                        date=target_date,
                        status=ReadingStatus.COMPLETED,
                        registered_by=1,  # Assumindo que existe um usuário com ID 1
                        created_at=target_date,
                        updated_at=target_date
                    )
                    
                    db.add(reading)
            
            db.commit()
            print(f"✅ Leituras para {reference_month} criadas")
        
        # Atualizar contadores do condomínio
        units_count = db.query(Unit).filter(Unit.condominium_id == test_condo.id).count()
        meters_count = db.query(Meter).join(Unit).filter(Unit.condominium_id == test_condo.id).count()
        readings_count = db.query(Reading).join(Meter).join(Unit).filter(Unit.condominium_id == test_condo.id).count()
        
        test_condo.units_count = units_count
        test_condo.meters_count = meters_count
        test_condo.readings_count = readings_count
        
        db.commit()
        
        print("🎉 Dados de teste criados com sucesso!")
        print(f"📊 Resumo:")
        print(f"   • Condomínio: {test_condo.name}")
        print(f"   • Unidades: {units_count}")
        print(f"   • Medidores: {meters_count}")
        print(f"   • Leituras: {readings_count}")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados de teste: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()