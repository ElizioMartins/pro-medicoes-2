import requests
import json

# Testar o endpoint de tipos de medição
url = "http://localhost:8000/api/measurement-types/"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Tipos de medição encontrados: {len(data)}")
        for item in data:
            print(f"- {item['name']} ({item['unit']})")
    else:
        print("Erro ao buscar tipos de medição")
        
except requests.exceptions.RequestException as e:
    print(f"Erro na requisição: {e}")
