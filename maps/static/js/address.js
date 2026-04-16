var LABELS = ['1', '2', '3', '4', '5'];
var pendingAddress = null;

/* =============================================
   입력 라벨 / 버튼 상태 관리
   ============================================= */
function updateInputLabels() {
    var rows = document.querySelectorAll('.input-row');
    rows.forEach(function(row, i) {
        var label = row.querySelector('.input-label');
        if (label) label.textContent = LABELS[i] || (i + 1);
    });
}

function updateRemoveButtons() {
    var rows = document.querySelectorAll('.input-row');
    var count = rows.length;
    rows.forEach(function(row) {
        var btn = row.querySelector('.remove-button');
        if (btn) btn.disabled = count <= 2;
    });
}

function updateAddButton() {
    var btn = document.querySelector('.btn-add');
    if (!btn) return;
    var count = document.querySelectorAll('.coordinate-input').length;
    btn.disabled = count >= 5;
    btn.textContent = count >= 5 ? '최대 5개' : '+ 추가';
}

/* =============================================
   입력칸 추가 / 삭제
   ============================================= */
function addAddressInput() {
    var addressCount = document.querySelectorAll('.coordinate-input').length;
    if (addressCount >= 5) return;

    var container = document.getElementById('input-container');
    var row = document.createElement('div');
    row.classList.add('input-row');

    var labelEl = document.createElement('span');
    labelEl.classList.add('input-label');
    labelEl.textContent = LABELS[addressCount] || (addressCount + 1);

    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'coordinate-input';
    input.classList.add('coordinate-input');
    input.placeholder = '클릭하여 출발지 검색';
    input.readOnly = true;

    var removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-button');
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('onclick', 'removeAddressInput(this)');

    row.appendChild(labelEl);
    row.appendChild(input);
    row.appendChild(removeBtn);
    container.appendChild(row);

    updateRemoveButtons();
    updateAddButton();
}

function removeAddressInput(button) {
    var row = button.parentNode;
    var addressCount = document.querySelectorAll('.coordinate-input').length;
    if (addressCount > 2) {
        row.parentNode.removeChild(row);
        updateInputLabels();
        updateRemoveButtons();
        updateAddButton();
    }
}

/* =============================================
   출발지 추가 확인 UI
   ============================================= */
function showAddConfirm(address, lat, lng) {
    dismissAddConfirm();

    if (document.querySelectorAll('.coordinate-input').length >= 5) {
        showToast('최대 5개까지 입력할 수 있습니다');
        return;
    }

    pendingAddress = { address: address, lat: lat, lng: lng };

    var wrap = document.createElement('div');
    wrap.id = 'add-confirm';
    wrap.className = 'add-confirm';

    var textEl = document.createElement('div');
    textEl.className = 'add-confirm-text';
    textEl.textContent = '출발지를 추가할까요?';

    var addrEl = document.createElement('div');
    addrEl.className = 'add-confirm-addr';
    addrEl.textContent = address.length > 28 ? address.substring(0, 27) + '…' : address;

    var actionsEl = document.createElement('div');
    actionsEl.className = 'add-confirm-actions';

    var yesBtn = document.createElement('button');
    yesBtn.className = 'add-confirm-yes';
    yesBtn.textContent = '+ 출발지 추가';
    yesBtn.addEventListener('click', function () {
        var pending = pendingAddress;
        dismissAddConfirm();
        addAddressInput();
        var inputs = document.querySelectorAll('.coordinate-input');
        if (inputs.length > 0) {
            var last = inputs[inputs.length - 1];
            last.value = pending.address;
            if (pending.lat && pending.lng) {
                last.dataset.lat = pending.lat;
                last.dataset.lng = pending.lng;
            }
        }
        var panel = document.getElementById('panel');
        if (panel && panel.classList.contains('panel--hidden')) togglePanel();
        showToast('출발지가 추가되었습니다');
    });

    var noBtn = document.createElement('button');
    noBtn.className = 'add-confirm-no';
    noBtn.textContent = '취소';
    noBtn.addEventListener('click', dismissAddConfirm);

    actionsEl.appendChild(yesBtn);
    actionsEl.appendChild(noBtn);
    wrap.appendChild(textEl);
    wrap.appendChild(addrEl);
    wrap.appendChild(actionsEl);

    var panel = document.getElementById('panel');
    var inputContainer = document.getElementById('input-container');
    if (panel && inputContainer) {
        panel.insertBefore(wrap, inputContainer);
        if (panel.classList.contains('panel--hidden')) togglePanel();
    }
}

function dismissAddConfirm() {
    pendingAddress = null;
    var existing = document.getElementById('add-confirm');
    if (existing) existing.remove();
}

/* =============================================
   입력값 채우기 (좌표 함께 저장)
   ============================================= */
function fillNextInput(address, lat, lng) {
    var inputs = document.querySelectorAll('.coordinate-input');
    for (var i = 0; i < inputs.length; i++) {
        if (!inputs[i].value.trim()) {
            inputs[i].value = address;
            if (lat && lng) {
                inputs[i].dataset.lat = lat;
                inputs[i].dataset.lng = lng;
            }
            showToast('출발지로 지정되었습니다');
            return;
        }
    }
    // 모든 칸이 찼을 때 → 추가 확인
    showAddConfirm(address, lat, lng);
}

/* =============================================
   내 위치 버튼
   ============================================= */
function addCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('이 브라우저는 위치 서비스를 지원하지 않습니다');
        return;
    }

    var btn = document.getElementById('my-location-btn');
    btn.disabled = true;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg> 확인 중...';

    navigator.geolocation.getCurrentPosition(function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;

        var geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, function(result, status) {
            btn.disabled = false;
            btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg> 내 위치';

            if (status === kakao.maps.services.Status.OK) {
                var address = result[0].road_address
                    ? result[0].road_address.address_name
                    : result[0].address.address_name;
                fillNextInput(address, lat, lng);
                map.setCenter(new kakao.maps.LatLng(lat, lng));
                map.setLevel(4);
            } else {
                showToast('현재 위치의 주소를 가져올 수 없습니다');
            }
        });
    }, function() {
        btn.disabled = false;
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg> 내 위치';
        showToast('위치 권한을 허용해주세요');
    });
}

/* =============================================
   주소 검색 모달
   ============================================= */
var addrPs = new kakao.maps.services.Places();
var activeInput = null;
var addrSearchTimer = null;

function openAddrModal(inputEl) {
    activeInput = inputEl;
    var modal = document.getElementById('addr-modal');
    var searchInput = document.getElementById('addr-search-input');
    modal.classList.add('addr-modal--open');
    // 기존 값이 있으면 검색어로 pre-fill
    searchInput.value = inputEl.value || '';
    document.getElementById('addr-result-list').innerHTML = '';
    // 약간 딜레이 후 포커스 (모달 애니메이션 중 포커스 방지)
    setTimeout(function() { searchInput.focus(); }, 50);
    if (searchInput.value) searchAddrPlaces(searchInput.value);
}

function closeAddrModal() {
    var modal = document.getElementById('addr-modal');
    modal.classList.remove('addr-modal--open');
    activeInput = null;
    document.getElementById('addr-result-list').innerHTML = '';
    document.getElementById('addr-search-input').value = '';
}

function searchAddrPlaces(query) {
    var list = document.getElementById('addr-result-list');
    list.innerHTML = '<li class="addr-result-loading">검색 중...</li>';

    addrPs.keywordSearch(query, function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            renderAddrResults(data);
        } else {
            list.innerHTML = '<li class="addr-result-empty">검색 결과가 없습니다</li>';
        }
    });
}

function renderAddrResults(places) {
    var list = document.getElementById('addr-result-list');
    list.innerHTML = '';

    places.forEach(function(place) {
        var li = document.createElement('li');
        li.className = 'addr-result-item';

        var addr = place.road_address_name || place.address_name;

        li.innerHTML =
            '<div class="addr-result-icon">' +
            '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
            '    <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>' +
            '    <circle cx="12" cy="11" r="3"/>' +
            '  </svg>' +
            '</div>' +
            '<div class="addr-result-info">' +
            '  <div class="addr-result-name">' + place.place_name + '</div>' +
            '  <div class="addr-result-addr">' + addr + '</div>' +
            '</div>';

        li.addEventListener('click', function() {
            if (activeInput) {
                activeInput.value = place.place_name;
                activeInput.dataset.lat = place.y;
                activeInput.dataset.lng = place.x;
            }
            closeAddrModal();
            showToast('출발지로 지정되었습니다');
        });

        list.appendChild(li);
    });
}

// 검색어 입력 (디바운스 300ms)
document.getElementById('addr-search-input').addEventListener('input', function() {
    var query = this.value.trim();
    clearTimeout(addrSearchTimer);
    if (!query) {
        document.getElementById('addr-result-list').innerHTML = '';
        return;
    }
    addrSearchTimer = setTimeout(function() {
        searchAddrPlaces(query);
    }, 300);
});

// 엔터키로 즉시 검색
document.getElementById('addr-search-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        clearTimeout(addrSearchTimer);
        var query = this.value.trim();
        if (query) searchAddrPlaces(query);
    }
});

// 닫기 버튼 / 오버레이 클릭
document.getElementById('addr-modal-close').addEventListener('click', closeAddrModal);
document.getElementById('addr-modal-overlay').addEventListener('click', closeAddrModal);

// ESC 키로 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAddrModal();
});

// 입력칸 클릭 → 모달 열기 (이벤트 위임으로 동적 입력칸도 처리)
document.getElementById('input-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('coordinate-input')) {
        openAddrModal(e.target);
    }
});

/* =============================================
   초기화
   ============================================= */
updateRemoveButtons();
updateAddButton();
