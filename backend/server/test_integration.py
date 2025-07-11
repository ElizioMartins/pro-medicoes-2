#!/usr/bin/env python3
"""
Script para testar integração frontend-backend
"""
import requests

def test_frontend_backend_integration():
    base_url = "http://127.0.0.1:8000"
    
    print("🔗 === TESTE INTEGRAÇÃO FRONTEND-BACKEND ===")
    
    # Login
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    print("\n1️⃣ === Login ===")
    response = requests.post(f"{base_url}/api/users/login", params=login_data)
    if response.status_code == 200:
        token = response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        print("✅ Login OK")
    else:
        print(f"❌ Erro no login: {response.status_code}")
        return
    
    # Testar endpoint de condomínios com formato esperado pelo frontend
    print("\n2️⃣ === Testando Endpoint Condomínios ===")
    response = requests.get(f"{base_url}/api/condominiums", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Endpoint OK")
        print(f"   Estrutura: {list(data.keys())}")
        print(f"   Total: {data.get('total', 0)}")
        print(f"   Condomínios: {len(data.get('condominiums', []))}")
        
        # Verificar estrutura de um condomínio
        if data.get('condominiums'):
            condo = data['condominiums'][0]
            print(f"   Primeiro condomínio: {condo.get('name', 'N/A')}")
            print(f"   Campos: {list(condo.keys())}")
    else:
        print(f"❌ Erro: {response.status_code}")
        print(f"   Resposta: {response.text}")
    
    # Testar CORS
    print("\n3️⃣ === Testando CORS ===")
    try:
        response = requests.options(f"{base_url}/api/condominiums", headers={
            'Origin': 'http://localhost:4200',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization,content-type'
        })
        print(f"✅ CORS OPTIONS: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"❌ Erro CORS: {e}")
    
    print("\n🎉 === TESTE FINALIZADO ===")

if __name__ == "__main__":
    test_frontend_backend_integration()
