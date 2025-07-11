#!/usr/bin/env python3
"""
Script para testar CRUD de unidades
"""
import requests
import json

def test_units():
    base_url = "http://127.0.0.1:8000"
    
    print("🏠 === TESTE CRUD DE UNIDADES ===")
    
    # Fazer login como admin
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    print("\n1️⃣ === Login como Admin ===")
    response = requests.post(f"{base_url}/api/users/login", params=login_data)
    if response.status_code == 200:
        token = response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        print("✅ Login bem-sucedido!")
    else:
        print(f"❌ Erro no login: {response.status_code}")
        return
    
    # Primeiro, criar um condomínio para teste
    print("\n2️⃣ === Criando Condomínio para Teste ===")
    condominium_data = {
        "name": "Condomínio Teste Unidades",
        "address": "Rua Teste, 456",
        "cnpj": "98.765.432/0001-99",
        "manager": "Gerente Teste",
        "phone": "(11) 88888-8888",
        "email": "teste_unidades@condominio.com"
    }
    
    response = requests.post(f"{base_url}/api/condominiums/", json=condominium_data, headers=headers)
    if response.status_code == 200:
        condominium = response.json()
        condominium_id = condominium['id']
        print(f"✅ Condomínio criado com ID: {condominium_id}")
    else:
        print(f"❌ Erro ao criar condomínio: {response.status_code}")
        return
    
    # Teste 1: Listar tipos de medição
    print("\n3️⃣ === Listar Tipos de Medição ===")
    response = requests.get(f"{base_url}/api/measurement-types", headers=headers)
    if response.status_code == 200:
        measurement_types = response.json()
        print(f"✅ {len(measurement_types)} tipos de medição encontrados")
        for mt in measurement_types:
            print(f"   - {mt['name']} ({mt['unit']})")
    else:
        print(f"❌ Erro ao listar tipos de medição: {response.status_code}")
        print(f"   Resposta: {response.text}")
    
    # Teste 2: Criar unidade
    print("\n4️⃣ === Criar Unidade ===")
    unit_data = {
        "number": "101",
        "owner": "João Silva",
        "meters_count": 2,
        "observations": "Unidade de teste"
    }
    
    response = requests.post(f"{base_url}/api/units/condominiums/{condominium_id}/units", json=unit_data, headers=headers)
    if response.status_code == 200:
        unit = response.json()
        unit_id = unit['id']
        print(f"✅ Unidade criada com ID: {unit_id}")
        print(f"   Número: {unit['number']}")
        print(f"   Proprietário: {unit['owner']}")
    else:
        print(f"❌ Erro ao criar unidade: {response.status_code}")
        print(f"   Resposta: {response.text}")
        return
    
    # Teste 3: Listar unidades do condomínio
    print("\n5️⃣ === Listar Unidades do Condomínio ===")
    response = requests.get(f"{base_url}/api/units/condominiums/{condominium_id}/units", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ {len(data['units'])} unidades encontradas")
        print(f"   Total: {data['total']}")
    else:
        print(f"❌ Erro ao listar unidades: {response.status_code}")
        print(f"   Resposta: {response.text}")
    
    # Teste 4: Buscar unidade por ID
    print("\n6️⃣ === Buscar Unidade por ID ===")
    response = requests.get(f"{base_url}/api/units/units/{unit_id}", headers=headers)
    if response.status_code == 200:
        unit = response.json()
        print(f"✅ Unidade encontrada: {unit['number']}")
        print(f"   Proprietário: {unit['owner']}")
    else:
        print(f"❌ Erro ao buscar unidade: {response.status_code}")
    
    # Teste 5: Atualizar unidade
    print("\n7️⃣ === Atualizar Unidade ===")
    update_data = {
        "owner": "Maria Santos",
        "observations": "Unidade atualizada"
    }
    
    response = requests.put(f"{base_url}/api/units/condominiums/{condominium_id}/units/{unit_id}", json=update_data, headers=headers)
    if response.status_code == 200:
        updated_unit = response.json()
        print(f"✅ Unidade atualizada!")
        print(f"   Proprietário: {updated_unit['owner']}")
        print(f"   Observações: {updated_unit['observations']}")
    else:
        print(f"❌ Erro ao atualizar unidade: {response.status_code}")
        print(f"   Resposta: {response.text}")
    
    # Teste 6: Tentar criar unidade com número duplicado
    print("\n8️⃣ === Testar Número Duplicado ===")
    duplicate_unit = {
        "number": "101",  # Mesmo número
        "owner": "Teste Duplicado"
    }
    
    response = requests.post(f"{base_url}/api/units/condominiums/{condominium_id}/units", json=duplicate_unit, headers=headers)
    if response.status_code == 400:
        print("✅ Validação de número duplicado funcionando")
    else:
        print(f"❌ Validação falhou: {response.status_code}")
    
    # Teste 7: Excluir unidade
    print("\n9️⃣ === Excluir Unidade ===")
    response = requests.delete(f"{base_url}/api/units/condominiums/{condominium_id}/units/{unit_id}", headers=headers)
    if response.status_code == 200:
        print("✅ Unidade excluída com sucesso!")
    else:
        print(f"❌ Erro ao excluir unidade: {response.status_code}")
        print(f"   Resposta: {response.text}")
    
    # Limpeza: Excluir condomínio de teste
    print("\n🧹 === Limpeza ===")
    response = requests.delete(f"{base_url}/api/condominiums/{condominium_id}", headers=headers)
    if response.status_code == 200:
        print("✅ Condomínio de teste excluído")
    
    print("\n🎉 === TESTE CRUD UNIDADES FINALIZADO ===")

if __name__ == "__main__":
    test_units()
