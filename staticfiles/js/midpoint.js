var mapContainer = document.getElementById('map'); // 지도를 표시할 div
var mapOption = {
  center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
  level: 8 // 지도의 확대 레벨
};

// 지도를 생성합니다
var map = new kakao.maps.Map(mapContainer, mapOption);
var infowindow = null;

// 지도 클릭 → 역지오코딩 → 툴팁 표시 → 버튼 클릭 시 입력
var suppressMapClick = false;
var clickMarker = null;
var clickOverlay = null;

function clearClickOverlay() {
    if (clickMarker) { clickMarker.setMap(null); clickMarker = null; }
    if (clickOverlay) { clickOverlay.setMap(null); clickOverlay = null; }
}

var geocoderForClick = new kakao.maps.services.Geocoder();
kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    if (suppressMapClick) {
        suppressMapClick = false;
        return;
    }
    var latlng = mouseEvent.latLng;

    clearClickOverlay();

    geocoderForClick.coord2Address(latlng.getLng(), latlng.getLat(), function(result, status) {
        if (status !== kakao.maps.services.Status.OK) return;

        var address = result[0].road_address
            ? result[0].road_address.address_name
            : result[0].address.address_name;

        clickMarker = new kakao.maps.Marker({ position: latlng });
        clickMarker.setMap(map);

        var wrap = document.createElement('div');
        wrap.className = 'search-result-overlay';

        var closeBtn = document.createElement('button');
        closeBtn.className = 'overlay-close-btn';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('mousedown', function(e) { e.stopPropagation(); suppressMapClick = true; });
        closeBtn.addEventListener('click', function(e) { e.stopPropagation(); clearClickOverlay(); });

        var addrEl = document.createElement('span');
        addrEl.textContent = address;

        var btn = document.createElement('button');
        btn.textContent = '출발지로 지정';

        // mousedown에서 플래그 설정 — 카카오맵이 click 처리하기 전에 차단
        btn.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            suppressMapClick = true;
        });
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            fillNextInput(address, latlng.getLat(), latlng.getLng());
            clearClickOverlay();
        });

        // 오버레이 영역 mousedown도 차단
        wrap.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });

        wrap.appendChild(closeBtn);
        wrap.appendChild(addrEl);
        wrap.appendChild(btn);

        clickOverlay = new kakao.maps.CustomOverlay({
            map: map,
            position: latlng,
            content: wrap,
            yAnchor: 1
        });
    });
});
//마커 이미지
var imageSrc = '/static/images/marker_purple.png', // 마커이미지의 주소입니다
    imageSize = new kakao.maps.Size(35, 30), // 마커이미지의 크기입니다
    imageOption = {offset: new kakao.maps.Point(17.5,30)};
var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
    markerPosition = new kakao.maps.LatLng(37.54699, 127.09598); // 마커가 표시될 위치입니다


// 경로 저장 변수 초기화
var route = '';
var polylines = [];
var totalTime = 0;
var addressMarkers = [];    // 출발지 마커 목록
var addressOverlays = [];   // 출발지 오버레이 목록
var stationOverlay = null;  // 중간 역 오버레이

var routeColors = ['#ff6b6b', '#4fc3f7', '#aed581', '#ffb74d', '#f06292'];

// 중간지점 찾기 버튼 로딩 상태 제어
function setFindBtnLoading(loading) {
    var btn = document.querySelector('.btn-find');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? '계산 중...' : '중간지점 찾기';
}

function clearMapOverlays() {
  clearClickOverlay();
  // 출발지 마커/오버레이 제거
  for (var i = 0; i < addressMarkers.length; i++) {
    addressMarkers[i].setMap(null);
  }
  addressMarkers = [];
  for (var i = 0; i < addressOverlays.length; i++) {
    addressOverlays[i].setMap(null);
  }
  addressOverlays = [];
  // 역 오버레이 제거
  if (stationOverlay) {
    stationOverlay.setMap(null);
    stationOverlay = null;
  }
  // 폴리라인 제거
  for (var i = 0; i < polylines.length; i++) {
    polylines[i].setMap(null);
  }
  polylines = [];
  route = '';
  // 결과 초기화
  var midpointResult = document.getElementById('midpointResult');
  if (midpointResult) { midpointResult.innerHTML = ''; }
}

function findMidpointAndStations() {
  var inputs = document.querySelectorAll('.coordinate-input');
  var addresses = [];

  // 입력값 검증
  for (var i = 0; i < inputs.length; i++) {
    var val = inputs[i].value.trim();
    if (!val) {
      showToast('주소를 모두 입력해주세요');
      inputs[i].focus();
      return;
    }
    addresses.push(val);
  }

  // 기존 마커/오버레이/경로 초기화
  clearMapOverlays();

  // 로딩 상태 시작
  setFindBtnLoading(true);

  // 주소들을 좌표로 변환 (모달에서 선택한 경우 data 속성으로 이미 저장된 좌표 사용)
  var geocoder = new kakao.maps.services.Geocoder();
  var geocodePromises = addresses.map(function (address, i) {
    var input = inputs[i];
    // 모달 선택으로 좌표가 이미 저장된 경우 → geocoding 생략
    if (input && input.dataset.lat && input.dataset.lng) {
      return Promise.resolve([input.dataset.lng, input.dataset.lat]);
    }
    return new Promise(function (resolve, reject) {
      geocoder.addressSearch(address, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
          resolve([result[0].x, result[0].y]);
        } else {
          reject(address);
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
          image: markerImage
        });
        addressMarker.setMap(map);
        addressMarkers.push(addressMarker);

        var labelText = addresses[i] || ('출발지 ' + (i + 1));
        if (labelText.length > 12) { labelText = labelText.substring(0, 11) + '…'; }
        var content = '<div class="customoverlay">' +
          '<a href="https://map.kakao.com/link/map/" target="_blank">' +
          '<span class="title">' + labelText + '</span>' +
          '</a></div>';
        var addrOverlay = new kakao.maps.CustomOverlay({
          map: map,
          position: addressCoords,
          content: content,
          yAnchor: 1
        });
        addressOverlays.push(addrOverlay);
      }
      var midpointX = totalX / coords.length;
      var midpointY = totalY / coords.length;
      // 중간지점 좌표를 주소로 변환
      var geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(midpointX, midpointY, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
          findNearestStations([midpointY, midpointX], result, coords, addresses);
        } else {
          showToast('중간지점 주소를 찾을 수 없습니다');
          setFindBtnLoading(false);
        }
      });
    })
    .catch(function (failedAddress) {
      showToast('주소를 찾을 수 없습니다. 다시 확인해주세요');
      setFindBtnLoading(false);
    });
}

// 두 좌표 사이 거리 계산 (km, Haversine)
function haversineDistance(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 각 출발지 → 중간지점 최대 거리 (km)
function maxDistanceToMidpoint(midpoint, coords) {
  var max = 0;
  for (var i = 0; i < coords.length; i++) {
    var d = haversineDistance(
      midpoint[0], midpoint[1],
      parseFloat(coords[i][1]), parseFloat(coords[i][0])
    );
    if (d > max) max = d;
  }
  return max;
}

// 교통수단 검색 순서: 지하철역 → 기차역 → 버스터미널
var TRANSIT_TYPES = [
  { query: '지하철역', icon: '🚇' },
  { query: '기차역',  icon: '🚂' },
  { query: '버스터미널', icon: '🚌' }
];
var TRANSIT_RADIUS = 10000; // 10km

function findNearestStations(midpoint, result, coords, addresses) {
  var maxDist = maxDistanceToMidpoint(midpoint, coords);

  // 모두 2km 이내 → 교통수단 불필요, 중간지점만 표시
  if (maxDist < 2) {
    showMidpointOnly(midpoint, result);
    setFindBtnLoading(false);
    return;
  }

  // 교통수단 순서대로 검색
  searchTransitInOrder(midpoint, result, coords, addresses, 0);
}

function searchTransitInOrder(midpoint, result, coords, addresses, idx) {
  if (idx >= TRANSIT_TYPES.length) {
    // 10km 안에 아무 교통수단도 없음 → 중간지점만 표시
    showToast('주변 10km 내 대중교통을 찾을 수 없습니다. 지도에서 만날 곳을 정해보세요');
    showMidpointOnly(midpoint, result);
    setFindBtnLoading(false);
    return;
  }

  var t = TRANSIT_TYPES[idx];
  var api_key = "2a976c987f3617744b5ee3ea43df3bd0";
  var url = "https://dapi.kakao.com/v2/local/search/keyword.json";
  var headers = { "Authorization": "KakaoAK " + api_key };
  var params = {
    "query": t.query,
    "x": midpoint[1],
    "y": midpoint[0],
    "radius": TRANSIT_RADIUS
  };

  fetch(url + "?" + new URLSearchParams(params), { headers: headers })
    .then(function (response) { return response.json(); })
    .then(function (data) {
      if (data.documents && data.documents.length > 0) {
        showStationResult(data.documents[0], t.icon, midpoint, coords, addresses);
      } else {
        // 이 교통수단 없음 → 다음 종류로
        searchTransitInOrder(midpoint, result, coords, addresses, idx + 1);
      }
    })
    .catch(function () {
      searchTransitInOrder(midpoint, result, coords, addresses, idx + 1);
    });
}

function showStationResult(station, icon, midpoint, coords, addresses) {
  var panel = document.getElementById('panel');
  if (panel && panel.classList.contains('panel--hidden')) { togglePanel(); }

  var midpointResult = document.getElementById("midpointResult");
  midpointResult.innerHTML =
    '<div class="result-station">' +
    '  <span class="result-station-name">' + icon + ' ' + station.place_name + '</span>' +
    '</div>' +
    '<div id="routeResultList"><span class="route-loading">경로 계산 중...</span></div>';

  if (infowindow) { infowindow.close(); }
  map.setCenter(new kakao.maps.LatLng(station.y, station.x));
  map.setLevel(4);

  stationOverlay = new kakao.maps.CustomOverlay({
    map: map,
    position: new kakao.maps.LatLng(station.y, station.x),
    content: '<div class="customoverlay2">' +
      '<a href="https://map.kakao.com/link/search/' + station.place_name + '" target="_blank">' +
      '<span class="title">' + station.place_name + '</span>' +
      '</a></div>',
    yAnchor: 1
  });

  findPublicTransitRoutes(coords, station.x, station.y, addresses);
}

function showMidpointOnly(midpoint, result) {
  var panel = document.getElementById('panel');
  if (panel && panel.classList.contains('panel--hidden')) { togglePanel(); }

  var addr = '';
  if (result && result[0]) {
    addr = result[0].road_address
      ? result[0].road_address.address_name
      : result[0].address.address_name;
  }

  var midpointResult = document.getElementById("midpointResult");
  midpointResult.innerHTML =
    '<div class="result-station">' +
    '  <span class="result-station-name">📍 중간 지점</span>' +
    '</div>' +
    '<div class="midpoint-only">' +
    '  <div class="midpoint-addr">' + (addr || '') + '</div>' +
    '  <div class="midpoint-msg">모두 가까이 계십니다!<br>이 근처에서 만나보세요 😊</div>' +
    '</div>';

  if (infowindow) { infowindow.close(); }
  map.setCenter(new kakao.maps.LatLng(midpoint[0], midpoint[1]));
  map.setLevel(5);

  stationOverlay = new kakao.maps.CustomOverlay({
    map: map,
    position: new kakao.maps.LatLng(midpoint[0], midpoint[1]),
    content: '<div class="customoverlay2">' +
      '<a href="#"><span class="title">중간 지점</span></a>' +
      '</div>',
    yAnchor: 1
  });
}

function findPublicTransitRoutes(startCoords, endX, endY, addresses) {
  var api_key = "h8P5wdwfOG2hEc2TihBk09Jp8Mt2J2yg7A9Jvgwe";
  var url = "https://apis.openapi.sk.com/transit/routes";
  var headers = {
    "Accept": "application/json",
    "appKey": api_key,
    "Content-Type": "application/json;charset=UTF-8"
  };

  var routeResults = new Array(startCoords.length);

  var routePromises = startCoords.map(function (coord, idx) {
    var params = {
      "startX": coord[0],
      "startY": coord[1],
      "endX": endX,
      "endY": endY,
      "reqCoordType": "WGS84GEO",
      "resCoordType": "WGS84GEO",
      "count": 1
    };

    return fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(params)
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (data.metaData && data.metaData.plan && data.metaData.plan.itineraries) {
          var itinerary = data.metaData.plan.itineraries[0];
          routeResults[idx] = {
            fare: itinerary.fare.regular.totalFare,
            time: Math.round(itinerary.totalTime / 60)
          };
          route = '';
          for (var j = 0; j < itinerary.legs.length; j++) {
            routepath(itinerary.legs[j]);
          }
          drawPolyline(routeColors[idx % routeColors.length]);
        }
      })
      .catch(function (error) {
        routeResults[idx] = null;
      });
  });

  Promise.all(routePromises).then(function () {
    displayRouteResults(routeResults, addresses);
    setFindBtnLoading(false);
  });
}

function displayRouteResults(routeResults, addresses) {
  var container = document.getElementById('routeResultList');
  if (!container) return;

  var html = '';
  for (var i = 0; i < routeResults.length; i++) {
    var r = routeResults[i];
    var label = (addresses && addresses[i]) ? addresses[i] : ('출발지 ' + (i + 1));
    if (label.length > 18) { label = label.substring(0, 17) + '…'; }

    var color = routeColors[i % routeColors.length];
    if (r) {
      html += '<div class="route-item">' +
              '<span class="route-num" style="background:' + color + '">' + (i + 1) + '</span>' +
              '<div class="route-info">' +
              '<span class="route-label">' + label + '</span>' +
              '<div class="route-meta">' +
              '<span class="route-time">⏱ ' + r.time + '분</span>' +
              '<span class="route-fare">💳 ' + r.fare.toLocaleString() + '원</span>' +
              '</div>' +
              '</div>' +
              '</div>';
    } else {
      html += '<div class="route-item">' +
              '<span class="route-num" style="background:' + color + '">' + (i + 1) + '</span>' +
              '<div class="route-info">' +
              '<span class="route-label">' + label + '</span>' +
              '<div class="route-meta"><span class="route-error">경로 없음</span></div>' +
              '</div>' +
              '</div>';
    }
  }
  container.innerHTML = html;
}

function routepath(path) {
  if (path.mode == 'WALK') {
    if (path.steps) {
      for (var i = 0; i < path.steps.length; i++) {
        route += path.steps[i].linestring + '|';
      }
    }
  } else if (path.mode == 'BUS' || path.mode == 'SUBWAY' || path.mode == 'TRANSFER') {
    if (path.passShape) {
      route += path.passShape.linestring + '|';
    }
  }
}


function drawPolyline(color) {
  if (route === '') return;

  var routeSegments = route.split('|');
  for (var i = 0; i < routeSegments.length; i++) {
    var routeCoords = routeSegments[i].split(' ').map(function (coord) {
      var parts = coord.split(',');
      var lng = parseFloat(parts[0]);
      var lat = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return new kakao.maps.LatLng(lat, lng);
      }
    }).filter(function (coord) {
      return coord !== undefined;
    });

    if (routeCoords.length < 2) continue;

    var pl = new kakao.maps.Polyline({
      path: routeCoords,
      strokeWeight: 6,
      strokeColor: color,
      strokeOpacity: 0.9,
      strokeStyle: 'solid'
    });
    pl.setMap(map);
    polylines.push(pl);
  }
}
