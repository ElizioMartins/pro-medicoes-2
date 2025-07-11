#!/usr/bin/env python3
"""
Script para testar restrições de permissão de usuários
"""
import requests
import json

def test_user_permissions():
    base_url = "http://127.0.0.1:8000"
    
    # Credenciais para teste
    users = [
        {"username": "admin", "password": "admin123", "role": "Admin"},
        {"username": "gerente", "password": "gerente123", "role": "Manager"},
        {"username": "leiturista", "password": "leiturista123", "role": "Reader"},
        {"username": "usuario", "password": "usuario123", "role": "User"}
    ]
    
    tokens = {}
    
    # Fazer login para cada usuário
    print("=== Fazendo login para todos os usuários ===")
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
    
    # Teste 1: Listar usuários com diferentes roles
    print("\n=== Teste 1: Listar usuários ===")
    for role, token in tokens.items():
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{base_url}/api/users", headers=headers)
        if response.status_code == 200:
            users_data = response.json()
            print(f"✅ {role}: pode ver {len(users_data['users'])} usuários")
        else:
            print(f"❌ {role}: erro {response.status_code}")
    
    # Teste 2: Tentar editar usuário com diferentes roles
    print("\n=== Teste 2: Editar usuário ===")
    test_user_data = {
        "name": "Nome Editado",
        "email": "editado@teste.com"
    }
    
    for role, token in tokens.items():
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        
        # Tentar editar usuário ID 5 (se existir)
        response = requests.put(f"{base_url}/api/users/5", json=test_user_data, headers=headers)
        if response.status_code == 200:
            print(f"✅ {role}: pode editar usuário")
        elif response.status_code == 403:
            print(f"🔒 {role}: sem permissão (correto)")
        elif response.status_code == 404:
            print(f"ℹ️  {role}: usuário não encontrado")
        else:
            print(f"❌ {role}: erro {response.status_code}")
    
    # Teste 3: Tentar excluir usuário com diferentes roles
    print("\n=== Teste 3: Excluir usuário ===")
    for role, token in tokens.items():
        headers = {'Authorization': f'Bearer {token}'}
        
        # Tentar excluir usuário ID 5 (se existir)
        response = requests.delete(f"{base_url}/api/users/5", headers=headers)
        if response.status_code == 200:
            print(f"✅ {role}: pode excluir usuário")
        elif response.status_code == 403:
            print(f"🔒 {role}: sem permissão (correto)")
        elif response.status_code == 404:
            print(f"ℹ️  {role}: usuário não encontrado")
        else:
            print(f"❌ {role}: erro {response.status_code}")
    
    # Teste 4: Tentar criar usuário
    print("\n=== Teste 4: Criar usuário ===")
    new_user_data = {
        "username": "novo_usuario_2",
        "email": "novo2@teste.com",
        "name": "Novo Usuário 2",
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
        elif response.status_code == 403:
            print(f"🔒 {role}: sem permissão (correto)")
        elif response.status_code == 400:
            print(f"ℹ️  {role}: usuário já existe")
        else:
            print(f"❌ {role}: erro {response.status_code}")

if __name__ == "__main__":
    test_user_permissions()
