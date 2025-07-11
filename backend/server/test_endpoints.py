#!/usr/bin/env python3
"""
Script para testar endpoints de unidades e tipos de medição
"""
import requests

def test_endpoints():
    base_url = "http://127.0.0.1:8000"
    
    print("🔧 === TESTE ENDPOINTS UNIDADES E TIPOS DE MEDIÇÃO ===")
    
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
    
    # Teste 1: Tipos de medição
    print("\n2️⃣ === Teste Tipos de Medição ===")
    response = requests.get(f"{base_url}/api/measurement-types", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        types = response.json()
        print(f"✅ {len(types)} tipos de medição encontrados")
        for t in types:
            print(f"   - {t['name']} ({t['unit']})")
    else:
        print(f"❌ Erro: {response.text}")
    
    # Teste 2: Listar condomínios para obter ID
    print("\n3️⃣ === Lista Condomínios ===")
    response = requests.get(f"{base_url}/api/condominiums", headers=headers)
    if response.status_code == 200:
        condos = response.json()
        if condos['condominiums']:
            condo_id = condos['condominiums'][0]['id']
            print(f"✅ Usando condomínio ID: {condo_id}")
            
            # Teste 3: Unidades do condomínio
            print("\n4️⃣ === Teste Unidades ===")
            response = requests.get(f"{base_url}/api/condominiums/{condo_id}/units", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                units = response.json()
                print(f"✅ {len(units['units'])} unidades encontradas")
                print(f"   Total: {units['total']}")
            else:
                print(f"❌ Erro: {response.text}")
        else:
            print("❌ Nenhum condomínio encontrado")
    else:
        print(f"❌ Erro ao listar condomínios: {response.status_code}")
    
    print("\n🎉 === TESTE FINALIZADO ===")

if __name__ == "__main__":
    test_endpoints()
