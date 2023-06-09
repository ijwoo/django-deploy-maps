var ps = new kakao.maps.services.Places();
function toggleSidebar() {
    var menuWrap = document.getElementById("menu_wrap");
    menuWrap.classList.toggle("active");
  }
function searchPlaces() {
    var keyword = document.getElementById('keyword').value;

    if (!keyword.replace(/^\s+|\s+$/g, '')) {
        alert('키워드를 입력해주세요!');
        return false;
    }

    ps.keywordSearch(keyword, placesSearchCB);
}

function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        displayPlaces(data);
        displayPagination(pagination);
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
    } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
    }
}

function displayPlaces(places) {
    var listEl = document.getElementById('placesList');
    menuEl = document.getElementById('menu_wrap'),
    fragment = document.createDocumentFragment(), 
    bounds = new kakao.maps.LatLngBounds(), 
    listStr = '';
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

    var itemStr = '<span class="markerbg marker_' + index + '"></span>'+
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
    return itemEl;
}

function removeAllChildNodes(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

function displayPagination(pagination) {
    var paginationEl = document.getElementById('pagination'),
        fragment = document.createDocumentFragment(),
        i; 

    // 기존에 추가된 페이지번호를 삭제합니다
    while (paginationEl.hasChildNodes()) {
        paginationEl.removeChild (paginationEl.lastChild);
    }

    for (i = 1; i <= pagination.last; i++) {
        var el = document.createElement('a');
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = 'on';
        } else {
            el.onclick = (function(i) {
                return function() {
                    pagination.gotoPage(i);
                };
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}