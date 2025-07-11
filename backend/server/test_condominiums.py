#!/usr/bin/env python3
"""
Script para testar CRUD de condomínios
"""
import requests
import json

def test_condominiums():
    base_url = "http://127.0.0.1:8000"
    
    print("🏠 === TESTE CRUD DE CONDOMÍNIOS ===")
    
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
    
    # Teste 1: Listar condomínios
    print("\n2️⃣ === Listar Condomínios ===")
    response = requests.get(f"{base_url}/api/condominiums", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Listagem OK - {len(data['condominiums'])} condomínios encontrados")
        print(f"   Total: {data['total']}")
    else:
        print(f"❌ Erro na listagem: {response.status_code}")
        print(f"   Resposta: {response.text}")
    
    # Teste 2: Criar condomínio
    print("\n3️⃣ === Criar Condomínio ===")
    new_condominium = {
        "name": "Condomínio Teste",
        "address": "Rua Teste, 123 - Bairro Teste",
        "cnpj": "12.345.678/0001-99",
        "manager": "Gerente Teste",
        "phone": "(11) 99999-9999",
        "email": "teste@condominio.com"
    }
    
    response = requests.post(f"{base_url}/api/condominiums/", json=new_condominium, headers=headers)
    if response.status_code == 200:
        created_condominium = response.json()
        condominium_id = created_condominium['id']
        print(f"✅ Condomínio criado com ID: {condominium_id}")
        print(f"   Nome: {created_condominium['name']}")
    else:
        print(f"❌ Erro ao criar condomínio: {response.status_code}")
        print(f"   Resposta: {response.text}")
        return
    
    # Teste 3: Buscar condomínio por ID
    print("\n4️⃣ === Buscar Condomínio por ID ===")
    response = requests.get(f"{base_url}/api/condominiums/{condominium_id}", headers=headers)
    if response.status_code == 200:
        condominium = response.json()
        print(f"✅ Condomínio encontrado: {condominium['name']}")
        print(f"   CNPJ: {condominium['cnpj']}")
    else:
        print(f"❌ Erro ao buscar condomínio: {response.status_code}")
    
    # Teste 4: Atualizar condomínio
    print("\n5️⃣ === Atualizar Condomínio ===")
    update_data = {
        "name": "Condomínio Teste Atualizado",
        "manager": "Novo Gerente"
    }
    
    response = requests.put(f"{base_url}/api/condominiums/{condominium_id}", json=update_data, headers=headers)
    if response.status_code == 200:
        updated_condominium = response.json()
        print(f"✅ Condomínio atualizado!")
        print(f"   Nome: {updated_condominium['name']}")
        print(f"   Gerente: {updated_condominium['manager']}")
    else:
        print(f"❌ Erro ao atualizar condomínio: {response.status_code}")
        print(f"   Resposta: {response.text}")
    
    # Teste 5: Buscar condomínios com filtro
    print("\n6️⃣ === Buscar com Filtro ===")
    response = requests.get(f"{base_url}/api/condominiums?search=Teste", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Busca com filtro OK - {len(data['condominiums'])} condomínios encontrados")
    else:
        print(f"❌ Erro na busca com filtro: {response.status_code}")
    
    # Teste 6: Excluir condomínio
    print("\n7️⃣ === Excluir Condomínio ===")
    response = requests.delete(f"{base_url}/api/condominiums/{condominium_id}", headers=headers)
    if response.status_code == 200:
        print("✅ Condomínio excluído com sucesso!")
    else:
        print(f"❌ Erro ao excluir condomínio: {response.status_code}")
        print(f"   Resposta: {response.text}")
    
    # Teste 7: Tentar buscar condomínio excluído
    print("\n8️⃣ === Verificar Exclusão ===")
    response = requests.get(f"{base_url}/api/condominiums/{condominium_id}", headers=headers)
    if response.status_code == 404:
        print("✅ Condomínio excluído corretamente (404)")
    else:
        print(f"❌ Condomínio ainda existe: {response.status_code}")
    
    print("\n🎉 === TESTE CRUD CONDOMÍNIOS FINALIZADO ===")

if __name__ == "__main__":
    test_condominiums()
