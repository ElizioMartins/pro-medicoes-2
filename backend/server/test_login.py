#!/usr/bin/env python3
"""
Script para testar o login da API
"""
import requests
import json

def test_login():
    base_url = "http://127.0.0.1:8000"
    
    # Teste de login com usuário admin
    print("=== Testando Login da API ===")
    
    # Dados de login
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # Fazer login
        response = requests.post(f"{base_url}/api/users/login", params=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login bem-sucedido!")
            print(f"Token: {data.get('access_token', 'N/A')[:50]}...")
            print(f"Usuário: {data.get('user', {}).get('username', 'N/A')}")
            print(f"Role: {data.get('user', {}).get('role', 'N/A')}")
            
            # Testar acesso protegido
            token = data.get('access_token')
            headers = {'Authorization': f'Bearer {token}'}
            
            # Teste de acesso ao dashboard (endpoint protegido)
            print("\n=== Testando endpoint protegido ===")
            me_response = requests.get(f"{base_url}/api/users/me", headers=headers)
            if me_response.status_code == 200:
                print("✅ Acesso a endpoint protegido funcionando!")
                print(f"Dados do usuário: {me_response.json()}")
            else:
                print(f"❌ Erro ao acessar endpoint protegido: {me_response.status_code}")
                print(f"Resposta: {me_response.text}")
                
        else:
            print(f"❌ Erro no login: {response.status_code}")
            print(f"Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro na conexão: {str(e)}")

if __name__ == "__main__":
    test_login()
