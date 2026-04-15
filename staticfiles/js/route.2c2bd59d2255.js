var mapContainer = document.getElementById('map'); // 지도를 표시할 div
var mapOption = {
    center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
    level: 4 // 지도의 확대 레벨
};

// 지도를 생성합니다
var map = new kakao.maps.Map(mapContainer, mapOption);

function findTransitRoute() {
    var startX = '127.030406594109'; // 출발지 좌표(경도)
    var startY = '37.609094989686'; // 출발지 좌표(위도)
    var endX = '127.02550910860451'; // 도착지 좌표(경도)
    var endY = '37.63788539420793'; // 도착지 좌표(위도)
    var appKey = 'h8P5wdwfOG2hEc2TihBk09Jp8Mt2J2yg7A9Jvgwe'; // T맵 API 인증 토큰

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://apis.openapi.sk.com/transit/routes');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('appKey', appKey); // 인증 토큰 설정

    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            // 경로 정보 가져오기
            console.log(data);

            // 경로 포인트 추출
            var guides = data.metaData.plan.itineraries[0].legs[0].points;

            // 출발지와 도착지 마커 생성
            var startMarker = new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(guides[0].y, guides[0].x),
                title: '출발지'
            });
            var endMarker = new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(guides[guides.length - 1].y, guides[guides.length - 1].x),
                title: '도착지'
            });

            // 경로 폴리라인 생성
            var linePath = [];
            guides.forEach(function(guide) {
                linePath.push(new kakao.maps.LatLng(guide.y, guide.x));
            });
            var polyline = new kakao.maps.Polyline({
                map: map,
                path: linePath,
                strokeWeight: 6, // 선 두께 설정
                strokeColor: '#00FF00', // 선 색상 설정 (초록색)
                strokeOpacity: 0.7,
                strokeStyle: 'solid'
            });

            // 출발지와 도착지를 포함한 경로를 보여주는 영역 계산
            var bounds = new kakao.maps.LatLngBounds();
            bounds.extend(startMarker.getPosition());
            bounds.extend(endMarker.getPosition());
            map.setBounds(bounds);
        } else {
            console.log('API 요청 중 오류가 발생했습니다.');
            console.log('Status:', xhr.status);
            console.log('Response:', xhr.responseText);
        }
    };

    var requestData = {
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        count: 10,
        lang: 0,
        format: 'json'
    };

    xhr.send(JSON.stringify(requestData));
}

findTransitRoute();