var mapContainer = document.getElementById('map'); // 지도를 표시할 div
var mapOption = {
  center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
  level: 1 // 지도의 확대 레벨
};

// 지도를 생성합니다
var map = new kakao.maps.Map(mapContainer, mapOption);
var infowindow = null;
//마커 이미지
var imageSrc = '/static/images/marker_purple.png', // 마커이미지의 주소입니다    
    imageSize = new kakao.maps.Size(35, 30), // 마커이미지의 크기입니다
    imageOption = {offset: new kakao.maps.Point(17.5,30)};
var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
    markerPosition = new kakao.maps.LatLng(37.54699, 127.09598); // 마커가 표시될 위치입니다


    // 경로 저장 변수 초기화
var route = '';
var polyline = null;
var totalTime = 0;

function findMidpointAndStations() {
  var inputs = document.querySelectorAll('.coordinate-input');
  var addresses = [];

  // 입력된 주소들을 배열에 저장
  for (var i = 0; i < inputs.length; i++) {
    addresses.push(inputs[i].value);
  }

  // 주소들을 좌표로 변환
  var geocoder = new kakao.maps.services.Geocoder();
  var geocodePromises = addresses.map(function (address) {
    return new Promise(function (resolve, reject) {
      geocoder.addressSearch(address, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
          resolve([result[0].x, result[0].y]);
          console.log("위도,경도:", result[0].x, result[0].y);
        } else {
          reject();
        }
      });
    });
  });

  // 좌표들의 평균값을 계산하여 중간지점 도출
  Promise.all(geocodePromises)
    .then(function (coords) {
      var totalX = 0;
      var totalY = 0;

      for (var i = 0; i < coords.length; i++) {
        totalX += parseFloat(coords[i][0]);
        totalY += parseFloat(coords[i][1]);
        var addressCoords = new kakao.maps.LatLng(coords[i][1], coords[i][0]);
        var addressMarker = new kakao.maps.Marker({
          position: addressCoords,
          image : markerImage
          
        });
        addressMarker.setMap(map);
        var content = '<div class="customoverlay">' +
          '  <a href="https://map.kakao.com/link/map/" target="_blank">' +
          '    <span class="title">'+ addresses[i].split(' ')[1]+'</span>' +
          '  </a>' +
          '</div>';
        var customOverlay = new kakao.maps.CustomOverlay({
          map: map,
          position: addressCoords,
          content: content,
          yAnchor: 1
        });
        
      }
      var midpointX = totalX / coords.length;
      var midpointY = totalY / coords.length;
      // 중간지점 좌표를 주소로 변환
      var geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(midpointX, midpointY, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
          //var midpointAddress = result[0].address_name;
          // 중간지점 주변 역 검색
          findNearestStations([midpointY, midpointX], result, coords);

        } else {
          console.log('중간지점 주소를 찾을 수 없습니다.');
        }
      });
    })
    .catch(function () {
      console.log('주소를 변환할 수 없습니다.');
    });
}

function findNearestStations(midpoint, result, coords) {
  var api_key = "2a976c987f3617744b5ee3ea43df3bd0";
  var url = "https://dapi.kakao.com/v2/local/search/keyword.json";
  var headers = { "Authorization": "KakaoAK " + api_key };
  var query = "지하철역";
  var params = { "query": query, "x": midpoint[1], "y": midpoint[0] };
  fetch(url + "?" + new URLSearchParams(params), { headers: headers })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.documents && data.documents.length > 0) {
        var station = data.documents.find(function (station) {
          return station.category_group_name === "지하철역";
        });
        if (station) {
          console.log(station.place_name);

          var midpointResult = document.getElementById("midpointResult");
          midpointResult.textContent = station.place_name;

          if (infowindow) {
            infowindow.close();
          }

          map.setCenter(new kakao.maps.LatLng(station.y, station.x));
          map.setLevel(4); // 지도 중심을 마커 위치로 설정

          customOverlay = new kakao.maps.CustomOverlay({
          map: map,
          position: new kakao.maps.LatLng(station.y, station.x),
          content: '<div class="customoverlay2">' +
          '  <a href="https://map.kakao.com/link/search/' + station.place_name + '" target="_blank">'+
          '    <span class="title">' + station.place_name + ' </span>' +
          '  </a>' +
          '</div>',
          yAnchor: 1
        });
          // T맵 대중교통 API를 사용하여 경로 표시
          findPublicTransitRoutes(coords, station.x, station.y);
        } else {
          console.log("주변 지하철 역을 찾을 수 없습니다.");
        }
      } else {
        console.log("주변 역을 찾을 수 없습니다.");
      }
    })
    .catch(function (error) {
      console.log("API 요청 중 오류가 발생했습니다.", error);
    });
}

function findPublicTransitRoutes(startCoords, endX, endY) {
  var api_key = "h8P5wdwfOG2hEc2TihBk09Jp8Mt2J2yg7A9Jvgwe";
  var url = "https://apis.openapi.sk.com/transit/routes";
  var headers = {
    "Accept": "application/json",
    "appKey": api_key,
    "Content-Type": "application/json;charset=UTF-8"
  };

  // 각 출발지와 목적지 간의 경로를 호출
  var routePromises = [];
  for (var i = 0; i < startCoords.length; i++) {
    var startX = startCoords[i][0];
    var startY = startCoords[i][1];

    var params = {
      "startX": startX,
      "startY": startY,
      "endX": endX,
      "endY": endY,
      "reqCoordType": "WGS84GEO",
      "resCoordType": "WGS84GEO",
      "count": 1
    };

    // API 호출 및 경로 저장
    var routePromise = fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(params)
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log('요금 :' + data.metaData.plan.itineraries[0].fare.regular.totalFare + '원')
        totalTime = Math.round(data.metaData.plan.itineraries[0].totalTime / 60);
        console.log('소요시간 :'+ Math.round(data.metaData.plan.itineraries[0].totalTime/60)+'분');
        if (data.metaData && data.metaData.plan && data.metaData.plan.itineraries) {
          var itineraries = data.metaData.plan.itineraries;
          for (var i = 0; i < 1; i++) {
            route = ''; // 경로 초기화
            for (var j = 0; j < itineraries[i].legs.length; j++) {
              var path = itineraries[i].legs[j];
              routepath(path); // 경로 저장 및 폴리라인 그리기
            }

          }
          drawPolyline()
          //console.log(route); // routes 배열 출력
        } else {
          console.log("경로 검색에 실패했습니다.");
        }
      
      })
      .catch(function (error) {
        console.log("API 요청 중 오류가 발생했습니다.", error);
      });
    routePromises.push(routePromise);
  }

  // 모든 경로 처리가 완료된 후에 폴리라인 그리기
  Promise.all(routePromises)
    .then(function () {
      console.log("모든 경로 그리기 완료");
    });
}

function routepath(path) {
  if (path.mode == 'WALK') {
    for (var i = 0; i < path.steps.length; i++) {
      route += path.steps[i].linestring + '|'; // 경로 구분자를 '|'로 변경
    }
  } else if (path.mode == 'BUS' || path.mode == 'SUBWAY' || path.mode == 'TRANSFER') {
    route += path.passShape.linestring + '|'; // 경로 구분자를 '|'로 변경
  }
}


var polyline = null;
function drawPolyline() {
  if (polyline) {
    polyline.setMap(null); // 이전 폴리라인 객체를 지도에서 제거
    polyline = null; // 폴리라인 변수 초기화
  }
  if (route !== '') {
    // 마지막 공백 제거
    if (route[route.length - 1] === ' ') {
      route = route.slice(0, -1);
    }

    var routes = route.split('|'); // 경로들을 구분하는 '|' 문자를 기준으로 분리

    for (var i = 0; i < routes.length; i++) {
      var routeCoords = routes[i].split(' ').map(function (coord) {
        var [lng, lat] = coord.split(','); // 경로 좌표 파싱
        if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
          return new kakao.maps.LatLng(parseFloat(lat), parseFloat(lng));
        }
      }).filter(function (coord) {
        return coord !== undefined; // undefined 값(좌표가 NaN인 경우) 필터링
      });

      polyline = new kakao.maps.Polyline({
        path: routeCoords,
        strokeWeight: 8.5,
        strokeColor: '#0efcfe',
        strokeOpacity: 0.9,
        strokeStyle: 'round'
      });
      polyline.setMap(map);
    }
  }
}