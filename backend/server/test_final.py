#!/usr/bin/env python3
"""
Script para testar o sistema completo
"""
import requests
import json

def test_system():
    base_url = "http://127.0.0.1:8000"
    
    print("🚀 === TESTE COMPLETO DO SISTEMA PRO-MEDIÇÕES ===")
    
    # Teste 1: Login com diferentes usuários
    print("\n1️⃣ === Testando Login ===")
    users = [
        {"username": "admin", "password": "admin123", "role": "Admin"},
        {"username": "gerente", "password": "gerente123", "role": "Manager"},
        {"username": "leiturista", "password": "leiturista123", "role": "Reader"},
        {"username": "usuario", "password": "usuario123", "role": "User"}
    ]
    
    tokens = {}
    for user in users:
        login_data = {
            "username": user["username"],
            "password": user["password"]
        }
        
        response = requests.post(f"{base_url}/api/users/login", params=login_data)
        if response.status_code == 200:
            tokens[user["role"]] = response.json().get('access_token')
            print(f"✅ Login {user['role']}: OK")
        else:
            print(f"❌ Login {user['role']}: ERRO - {response.status_code}")
    
    # Teste 2: Verificar permissões de visualização
    print("\n2️⃣ === Testando Permissões de Visualização ===")
    for role, token in tokens.items():
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{base_url}/api/users", headers=headers)
        if response.status_code == 200:
            users_data = response.json()
            print(f"✅ {role}: pode ver {len(users_data['users'])} usuários")
        else:
            print(f"❌ {role}: erro {response.status_code}")
    
    # Teste 3: Criar usuário
    print("\n3️⃣ === Testando Criação de Usuário ===")
    new_user_data = {
        "username": "teste_final",
        "email": "teste_final@teste.com",
        "name": "Usuário Teste Final",
        "password": "senha123",
        "role": "User",
        "status": "Active",
        "active": True
    }
    
    for role, token in tokens.items():
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        response = requests.post(f"{base_url}/api/users/", json=new_user_data, headers=headers)
        
        if response.status_code == 200:
            print(f"✅ {role}: pode criar usuário")
            if role == "Admin":
                created_user = response.json()
                test_user_id = created_user['id']
        elif response.status_code == 403:
            print(f"🔒 {role}: sem permissão para criar usuário (correto)")
        elif response.status_code == 400:
            print(f"ℹ️  {role}: usuário já existe")
        else:
            print(f"❌ {role}: erro {response.status_code}")
    
    # Teste 4: Editar usuário
    print("\n4️⃣ === Testando Edição de Usuário ===")
    edit_data = {
        "name": "Nome Editado Final",
        "email": "editado_final@teste.com"
    }
    
    for role, token in tokens.items():
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        response = requests.put(f"{base_url}/api/users/{test_user_id}", json=edit_data, headers=headers)
        
        if response.status_code == 200:
            print(f"✅ {role}: pode editar usuário")
        elif response.status_code == 403:
            print(f"🔒 {role}: sem permissão para editar usuário (correto)")
        elif response.status_code == 404:
            print(f"ℹ️  {role}: usuário não encontrado")
        else:
            print(f"❌ {role}: erro {response.status_code}")
    
    # Teste 5: Excluir usuário
    print("\n5️⃣ === Testando Exclusão de Usuário ===")
    for role, token in tokens.items():
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.delete(f"{base_url}/api/users/{test_user_id}", headers=headers)
        
        if response.status_code == 200:
            print(f"✅ {role}: pode excluir usuário")
        elif response.status_code == 403:
            print(f"🔒 {role}: sem permissão para excluir usuário (correto)")
        elif response.status_code == 404:
            print(f"ℹ️  {role}: usuário não encontrado")
        else:
            print(f"❌ {role}: erro {response.status_code}")
    
    # Teste 6: Verificar endpoints protegidos
    print("\n6️⃣ === Testando Endpoints Protegidos ===")
    protected_endpoints = [
        ("/api/users/me", "GET"),
        ("/api/condominiums", "GET"),
        ("/api/readings", "GET")
    ]
    
    for endpoint, method in protected_endpoints:
        print(f"\nTestando {method} {endpoint}:")
        for role, token in tokens.items():
            headers = {'Authorization': f'Bearer {token}'}
            if method == "GET":
                response = requests.get(f"{base_url}{endpoint}", headers=headers)
            
            if response.status_code == 200:
                print(f"✅ {role}: acesso autorizado")
            elif response.status_code == 401:
                print(f"🔒 {role}: não autorizado (correto)")
            else:
                print(f"❌ {role}: erro {response.status_code}")
    
    print("\n🎉 === TESTE COMPLETO FINALIZADO ===")

if __name__ == "__main__":
    test_system()
