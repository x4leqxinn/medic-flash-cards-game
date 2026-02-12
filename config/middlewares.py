import requests
from django.http import HttpResponseForbidden

class ChileOnlyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Intentar obtener la IP real desde varios encabezados
        ip = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip:
            ip = ip.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')

        # LOG PARA DEPURAR: Verás esto en tu terminal de Docker
        print(f"DEBUG: Intentando acceso desde IP: {ip}")

        # 2. PERMITIR SIEMPRE IPs PRIVADAS (Red local y Docker)
        # Esto evitará que te bloquee si la IP es interna
        if ip.startswith(('127.', '192.168.', '10.', '172.')) or ip == '::1':
            return self.get_response(request)

        # 3. Consulta a la API
        try:
            response = requests.get(f'http://ip-api.com/json/{ip}', timeout=1.5).json()
            country_code = response.get('countryCode')
            
            print(f"DEBUG: País detectado: {country_code}")

            if response.get('status') == 'success' and country_code != 'CL':
                return HttpResponseForbidden(f"Acceso denegado")
                
        except Exception as e:
            print(f"DEBUG: Error en API de GeoLocalización: {e}")
            pass

        return self.get_response(request)