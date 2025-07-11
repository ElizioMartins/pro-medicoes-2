#!/usr/bin/env python3
"""
Script para testar criação de usuário
"""
import requests
import json

def test_create_user():
    base_url = "http://127.0.0.1:8000"
    
    # Primeiro fazer login para obter token
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    print("=== Fazendo login ===")
    login_response = requests.post(f"{base_url}/api/users/login", params=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Erro no login: {login_response.status_code}")
        print(f"Resposta: {login_response.text}")
        return
    
    token = login_response.json().get('access_token')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Dados do novo usuário
    user_data = {
        "username": "teste",
        "email": "teste@teste.com",
        "name": "Usuário Teste",
        "password": "teste123",
        "role": "User",
        "status": "Active",
        "active": True
    }
    
    print("\n=== Testando criação de usuário ===")
    
    # Teste 1: POST /api/users
    print("Testando POST /api/users")
    response1 = requests.post(f"{base_url}/api/users", json=user_data, headers=headers)
    print(f"Status: {response1.status_code}")
    print(f"Resposta: {response1.text}")
    
    # Teste 2: POST /api/users/
    print("\nTestando POST /api/users/")
    response2 = requests.post(f"{base_url}/api/users/", json=user_data, headers=headers)
    print(f"Status: {response2.status_code}")
    print(f"Resposta: {response2.text}")

if __name__ == "__main__":
    test_create_user()
