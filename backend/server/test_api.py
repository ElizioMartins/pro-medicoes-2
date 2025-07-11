"""
Script para testar a API e verificar se a autenticação está funcionando.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("🧪 Testando API do Pro-Medições...")
    
    # Teste 1: Health check
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check OK")
        else:
            print(f"❌ Health check falhou: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return
    
    # Teste 2: Login com admin
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/api/users/login", params=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user")
            print(f"✅ Login admin OK - Role: {user.get('role')}")
            
            # Teste 3: Acessar endpoint protegido
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/api/users/me", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"✅ Endpoint protegido OK - Usuário: {user_data.get('name')}")
                
                # Teste 4: Listar usuários (só admin/manager)
                response = requests.get(f"{BASE_URL}/api/users", headers=headers)
                if response.status_code == 200:
                    users_data = response.json()
                    print(f"✅ Listagem de usuários OK - Total: {users_data.get('total', 0)}")
                else:
                    print(f"❌ Erro ao listar usuários: {response.status_code}")
                    
            else:
                print(f"❌ Erro no endpoint protegido: {response.status_code}")
                
        else:
            print(f"❌ Login falhou: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Erro no teste de login: {e}")
    
    # Teste 5: Login com leiturista
    try:
        login_data = {
            "username": "leiturista",
            "password": "leiturista123"
        }
        response = requests.post(f"{BASE_URL}/api/users/login", params=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user")
            print(f"✅ Login leiturista OK - Role: {user.get('role')}")
            
            # Testar se leiturista pode acessar leituras
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/api/readings", headers=headers)
            
            if response.status_code == 200:
                print("✅ Leiturista pode acessar leituras")
            else:
                print(f"❌ Leiturista não pode acessar leituras: {response.status_code}")
                
            # Testar se leiturista NÃO pode listar usuários
            response = requests.get(f"{BASE_URL}/api/users", headers=headers)
            if response.status_code == 403:
                print("✅ Leiturista corretamente bloqueado de listar usuários")
            else:
                print(f"❌ Leiturista deveria ser bloqueado: {response.status_code}")
                
        else:
            print(f"❌ Login leiturista falhou: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro no teste leiturista: {e}")
    
    print("\n🎉 Testes concluídos!")

if __name__ == "__main__":
    test_api()
