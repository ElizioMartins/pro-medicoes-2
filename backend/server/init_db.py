"""
Script para inicializar o banco de dados com dados padrão.
"""
import os
from sqlalchemy.orm import Session
from dbmodels.database import engine, get_db
from dbmodels.users import User, UserRole, UserStatus
from dbmodels.condominiums import Condominium
from dbmodels.measurement_types import MeasurementType
from auth import get_password_hash

def init_database():
    """
    Inicializa o banco de dados com dados padrão.
    """
    db = next(get_db())
    
    # Criar usuário admin padrão
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@promedicoes.com",
            name="Administrador",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            active=True,
            initials="AD",
            avatar_color="#FF6B6B"
        )
        db.add(admin_user)
        print("✅ Usuário admin criado (admin/admin123)")
    
    # Criar usuário gerente padrão
    manager_user = db.query(User).filter(User.username == "gerente").first()
    if not manager_user:
        manager_user = User(
            username="gerente",
            email="gerente@promedicoes.com",
            name="Gerente",
            password_hash=get_password_hash("gerente123"),
            role=UserRole.MANAGER,
            status=UserStatus.ACTIVE,
            active=True,
            initials="GE",
            avatar_color="#4ECDC4"
        )
        db.add(manager_user)
        print("✅ Usuário gerente criado (gerente/gerente123)")
    
    # Criar usuário leiturista padrão
    reader_user = db.query(User).filter(User.username == "leiturista").first()
    if not reader_user:
        reader_user = User(
            username="leiturista",
            email="leiturista@promedicoes.com",
            name="Leiturista",
            password_hash=get_password_hash("leiturista123"),
            role=UserRole.READER,
            status=UserStatus.ACTIVE,
            active=True,
            initials="LE",
            avatar_color="#45B7D1"
        )
        db.add(reader_user)
        print("✅ Usuário leiturista criado (leiturista/leiturista123)")
    
    # Criar usuário comum padrão
    common_user = db.query(User).filter(User.username == "usuario").first()
    if not common_user:
        common_user = User(
            username="usuario",
            email="usuario@promedicoes.com",
            name="Usuário Comum",
            password_hash=get_password_hash("usuario123"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            active=True,
            initials="UC",
            avatar_color="#96CEB4"
        )
        db.add(common_user)
        print("✅ Usuário comum criado (usuario/usuario123)")
    
    # Criar tipos de medição padrão
    measurement_types = [
        {"name": "Água", "unit": "m³"},
        {"name": "Energia", "unit": "kWh"},
        {"name": "Gás", "unit": "m³"},
    ]
    
    for mt_data in measurement_types:
        existing_mt = db.query(MeasurementType).filter(MeasurementType.name == mt_data["name"]).first()
        if not existing_mt:
            measurement_type = MeasurementType(
                name=mt_data["name"],
                unit=mt_data["unit"],
                active=True
            )
            db.add(measurement_type)
            print(f"✅ Tipo de medição '{mt_data['name']}' criado")
    
    # Criar condomínio de exemplo
    example_condo = db.query(Condominium).filter(Condominium.cnpj == "12.345.678/0001-90").first()
    if not example_condo:
        example_condo = Condominium(
            name="Condomínio Exemplo",
            address="Rua das Flores, 123 - Centro",
            cnpj="12.345.678/0001-90",
            manager="João Silva",
            phone="(11) 1234-5678",
            email="contato@condominioexemplo.com.br",
            units_count=0,
            meters_count=0,
            readings_count=0,
            reports_count=0
        )
        db.add(example_condo)
        print("✅ Condomínio exemplo criado")
    
    db.commit()
    db.close()
    print("🎉 Banco de dados inicializado com sucesso!")

if __name__ == "__main__":
    init_database()
