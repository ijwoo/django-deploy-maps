from django.shortcuts import render
import requests
import json
from .forms import LocationForm
from django.http import JsonResponse
# 지도 표시
def display_map(request):
    return render(request, 'maps/kakao_maps.html')

# 지오코드
CLIENT_ID = 'igribv33sn'
CLIENT_SECRET = 'drK05RjHde6QqWgbMDqNzdOpgCnrLLW8CDqnxcNl'

def geocode(address):
    url = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode'
    headers = {
        'X-NCP-APIGW-API-KEY-ID': CLIENT_ID,
        'X-NCP-APIGW-API-KEY': CLIENT_SECRET
    }
    params = {
        'query': address
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        if 'addresses' in data and len(data['addresses'])>0:
            location = data['addresses'][0]
            return {
                'latitude': location['y'],
                'longitude': location['x'],
                'address': location['roadAddress']
            }
        else:
            return None
    except requests.exceptions.RequestException as e:
        print('Geocoding request failed:', e)
        return None
#역지오코딩
def reverse_geocode(latitude, longitude):
    url = 'https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc'
    headers = {
        'X-NCP-APIGW-API-KEY-ID': CLIENT_ID,
        'X-NCP-APIGW-API-KEY': CLIENT_SECRET
    }
    params = {
        'request': 'coordsToaddr',
        'coords': f'{longitude},{latitude}',
        'output': 'json'
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        if 'results' in data and len(data['results']) > 0:
            address_parts = data['results'][0]['region']
            address_parts = [part['name'] for part in address_parts.values() if part.get('name')]
            address_parts = [part for part in address_parts if part != 'kr']
            address = ' '.join(address_parts)
            return {'address': address}
        else:
            return None
    except requests.exceptions.RequestException as e:
        print('Reverse geocoding request failed:', e)
        return None


def geocode_view(request):
    if request.method == 'POST':
        address = request.POST.get('address')

        if address is not None and address.strip() != '':
            geocode_result = geocode(address)
            if geocode_result:
                return JsonResponse(geocode_result)
            else:
                return JsonResponse({'error': '지오코딩 결과를 가져올 수 없습니다.'})
        else:
            return JsonResponse({'error': '주소를 입력해주세요.'})
    else:
        return JsonResponse({'error': '잘못된 요청 메서드입니다.'})
    
def mid_point_view(request):
    return render(request, 'maps/mid_point.html')


#검색
def search(request):
    query = request.GET.get('query', '')

    headers = {
        'X-Naver-Client-Id': 'kFH6gweyTTHooPJBxBEu',
        'X-Naver-Client-Secret': 'eBKDsy2mW8'
    }
    response = requests.get(
        'https://openapi.naver.com/v1/search/local',
        params={'query': query},
        headers=headers
    )
    data = response.json()

    return JsonResponse(data, safe=False)

#가까운 역 찾기
def find_nearest_station(midpoint):
    api_key = "2a976c987f3617744b5ee3ea43df3bd0"
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {api_key}"}
    query = "지하철역"  # '지하철역'으로 검색하도록 수정
    params = {"query": query, "x": midpoint[1], "y": midpoint[0]}
    
    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    if "documents" in data and data["documents"]:
        for station in data["documents"]:
            if station.get("category_group_name") == "지하철역":
                return station["place_name"]  # 첫 번째 가까운 '지하철역'의 'place_name'을 반환
    
    return None

#대중교통 경로 찾기 예시