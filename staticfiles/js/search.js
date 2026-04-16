var ps = new kakao.maps.services.Places();
var searchMarkers = [];
var searchOverlay = null;

function toggleSidebar() {
    var menuWrap = document.getElementById("menu_wrap");
    menuWrap.classList.toggle("active");
}

function searchPlaces() {
    var keyword = document.getElementById('keyword').value;
    if (!keyword.replace(/^\s+|\s+$/g, '')) {
        showToast('키워드를 입력해주세요');
        return false;
    }
    ps.keywordSearch(keyword, placesSearchCB);
}

function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        displayPlaces(data);
        displayPagination(pagination);
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        showToast('검색 결과가 없습니다');
    } else if (status === kakao.maps.services.Status.ERROR) {
        showToast('검색 중 오류가 발생했습니다');
    }
}

function clearSearchMarkers() {
    for (var i = 0; i < searchMarkers.length; i++) {
        searchMarkers[i].setMap(null);
    }
    searchMarkers = [];
    if (searchOverlay) {
        searchOverlay.setMap(null);
        searchOverlay = null;
    }
}

function displayPlaces(places) {
    var listEl = document.getElementById('placesList');
    var fragment = document.createDocumentFragment();
    removeAllChildNodes(listEl);

    for (var i = 0; i < places.length; i++) {
        var itemEl = getListItem(places[i], i + 1);
        fragment.appendChild(itemEl);
    }
    listEl.appendChild(fragment);
}

function getListItem(place, index) {
    var itemEl = document.createElement('li');
    itemEl.className = 'item';

    var itemStr = '<span class="place-num">' + index + '</span>' +
                  '<div class="info">' +
                  '   <h5>' + place.place_name + '</h5>';

    if (place.road_address_name) {
        itemStr += '    <span>' + place.road_address_name + '</span>' +
                   '   <span class="jibun gray">' + place.address_name + '</span>';
    } else {
        itemStr += '    <span>' + place.address_name + '</span>';
    }

    itemStr += '  <span class="tel">' + place.phone + '</span>' +
               '</div>';

    itemEl.innerHTML = itemStr;

    itemEl.addEventListener('click', function () {
        selectSearchPlace(place);
    });

    return itemEl;
}

function selectSearchPlace(place) {
    var position = new kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x));

    clearSearchMarkers();

    map.setCenter(position);
    map.setLevel(3);

    var marker = new kakao.maps.Marker({ position: position });
    marker.setMap(map);
    searchMarkers.push(marker);

    var address = place.road_address_name || place.address_name;

    // 오버레이 콘텐츠 DOM 생성
    var wrap = document.createElement('div');
    wrap.className = 'search-result-overlay';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('mousedown', function(e) { e.stopPropagation(); suppressMapClick = true; });
    closeBtn.addEventListener('click', function(e) { e.stopPropagation(); clearSearchMarkers(); });

    var nameEl = document.createElement('strong');
    nameEl.textContent = place.place_name;

    var addrEl = document.createElement('span');
    addrEl.textContent = address;

    var btn = document.createElement('button');
    btn.textContent = '출발지로 지정';
    btn.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        suppressMapClick = true;
    });
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setAsInput(place.place_name, place.y, place.x);
    });

    wrap.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    });

    wrap.appendChild(closeBtn);
    wrap.appendChild(nameEl);
    wrap.appendChild(addrEl);
    wrap.appendChild(btn);

    searchOverlay = new kakao.maps.CustomOverlay({
        map: map,
        position: position,
        content: wrap,
        yAnchor: 1
    });
}

function setAsInput(address, lat, lng) {
    if (searchOverlay) {
        searchOverlay.setMap(null);
        searchOverlay = null;
    }

    // 패널이 닫혀있으면 열기
    var panel = document.getElementById('panel');
    if (panel && panel.classList.contains('panel--hidden')) {
        togglePanel();
    }

    fillNextInput(address, lat, lng);
}

function removeAllChildNodes(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

function displayPagination(pagination) {
    var paginationEl = document.getElementById('pagination');
    var fragment = document.createDocumentFragment();
    var i;

    while (paginationEl.hasChildNodes()) {
        paginationEl.removeChild(paginationEl.lastChild);
    }

    for (i = 1; i <= pagination.last; i++) {
        var el = document.createElement('a');
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = 'on';
        } else {
            el.onclick = (function (i) {
                return function () {
                    pagination.gotoPage(i);
                    return false;
                };
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}
